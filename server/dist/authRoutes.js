"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
const node_util_1 = require("node:util");
const express_1 = require("express");
const db_js_1 = __importDefault(require("./db.js"));
const auth_js_1 = require("./auth.js");
const router = (0, express_1.Router)();
const scrypt = (0, node_util_1.promisify)(node_crypto_1.scrypt);
const SESSION_DAYS = 30;
async function passwordHash(password, salt = (0, node_crypto_1.randomBytes)(16).toString("hex")) {
    const derived = (await scrypt(password, salt, 64));
    return `${salt}:${derived.toString("hex")}`;
}
async function verifyPassword(password, stored) {
    const [salt, expectedHex] = stored.split(":");
    if (!salt || !expectedHex)
        return false;
    const expected = Buffer.from(expectedHex, "hex");
    const actual = (await scrypt(password, salt, expected.length));
    return expected.length === actual.length && (0, node_crypto_1.timingSafeEqual)(expected, actual);
}
async function issueSession(userId) {
    const token = (0, node_crypto_1.randomBytes)(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 19).replace("T", " ");
    await db_js_1.default.prepare("INSERT INTO sessions (tokenHash, userId, expiresAt) VALUES (?, ?, ?)")
        .run((0, auth_js_1.hashToken)(token), userId, expiresAt);
    return token;
}
async function publicUser(userId) {
    return await db_js_1.default.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(userId);
}
router.post("/signup", async (req, res) => {
    const { name, email, password } = req.body ?? {};
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || typeof password !== "string" || password.length < 8) {
        res.status(400).json({ error: "Enter your name, a valid email, and a password of at least 8 characters." });
        return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        res.status(400).json({ error: "Enter a valid email address." });
        return;
    }
    try {
        const id = (0, node_crypto_1.randomUUID)();
        const hash = await passwordHash(password);
        await db_js_1.default.transaction(async () => {
            const role = process.env.ADMIN_EMAIL?.trim().toLowerCase() === normalizedEmail
                ? "admin"
                : "user";
            await db_js_1.default.prepare("INSERT INTO users (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)")
                .run(id, name.trim(), normalizedEmail, hash, role);
            // Preserve existing locally stored records by assigning them to the first account.
            const userCount = (await db_js_1.default.prepare("SELECT COUNT(*) AS count FROM users").get()).count;
            if (userCount === 1) {
                await db_js_1.default.prepare("UPDATE expenses SET userId = ? WHERE userId IS NULL").run(id);
                await db_js_1.default.prepare("UPDATE budgets SET userId = ? WHERE userId IS NULL").run(id);
            }
        });
        res.status(201).json({
            message: "Account created. Please sign in.",
            user: await publicUser(id),
        });
    }
    catch (error) {
        if (error instanceof Error && (error.message.includes("UNIQUE constraint failed") || error.code === "23505")) {
            res.status(409).json({ error: "An account with this email already exists." });
            return;
        }
        res.status(500).json({ error: "Could not create your account." });
    }
});
router.post("/signin", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const user = await db_js_1.default.prepare("SELECT id, passwordHash FROM users WHERE email = ?").get(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
    }
    res.json({ user: await publicUser(user.id), token: await issueSession(user.id) });
});
router.get("/me", auth_js_1.requireAuth, async (req, res) => {
    res.json(await publicUser(req.userId));
});
router.post("/signout", auth_js_1.requireAuth, async (req, res) => {
    const token = req.header("Authorization").slice(7);
    await db_js_1.default.prepare("DELETE FROM sessions WHERE tokenHash = ?").run((0, auth_js_1.hashToken)(token));
    res.status(204).send();
});
exports.default = router;
