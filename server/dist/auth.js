"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashToken = hashToken;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
exports.authenticatedUserId = authenticatedUserId;
const node_crypto_1 = require("node:crypto");
const db_js_1 = __importDefault(require("./db.js"));
function hashToken(token) {
    return (0, node_crypto_1.createHash)("sha256").update(token).digest("hex");
}
async function requireAuth(req, res, next) {
    const authorization = req.header("Authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) {
        res.status(401).json({ error: "Please sign in to continue." });
        return;
    }
    let session;
    try {
        session = await db_js_1.default.prepare(`
      SELECT userId FROM sessions WHERE tokenHash = ? AND expiresAt > datetime('now')
    `).get(hashToken(token));
    }
    catch {
        res.status(500).json({ error: "Could not verify your session." });
        return;
    }
    if (!session) {
        res.status(401).json({ error: "Your session has expired. Please sign in again." });
        return;
    }
    req.userId = session.userId;
    next();
}
async function requireAdmin(req, res, next) {
    let role;
    try {
        role = await db_js_1.default.prepare("SELECT role FROM users WHERE id = ?").get(req.userId);
    }
    catch {
        res.status(500).json({ error: "Could not verify administrator access." });
        return;
    }
    if (role?.role !== "admin") {
        res.status(403).json({ error: "Administrator access is required." });
        return;
    }
    next();
}
function authenticatedUserId(req) {
    if (!req.userId)
        throw new Error("Authenticated route has no user ID.");
    return req.userId;
}
