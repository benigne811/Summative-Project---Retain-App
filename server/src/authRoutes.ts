import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Router, type Request, type Response } from "express";
import db from "./db.js";
import { hashToken, requireAuth, type AuthenticatedRequest } from "./auth.js";

const router = Router();
const scrypt = promisify(scryptCallback);
const SESSION_DAYS = 30;

async function passwordHash(password: string, salt = randomBytes(16).toString("hex")) {
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function issueSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 19).replace("T", " ");
  await db.prepare("INSERT INTO sessions (tokenHash, userId, expiresAt) VALUES (?, ?, ?)")
    .run(hashToken(token), userId, expiresAt);
  return token;
}

async function publicUser(userId: string) {
  return await db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(userId);
}

router.post("/signup", async (req: Request, res: Response) => {
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
    const id = randomUUID();
    const hash = await passwordHash(password);
    await db.transaction(async () => {
      const role = process.env.ADMIN_EMAIL?.trim().toLowerCase() === normalizedEmail
        ? "admin"
        : "user";
      await db.prepare("INSERT INTO users (id, name, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)")
        .run(id, name.trim(), normalizedEmail, hash, role);
      // Preserve existing locally stored records by assigning them to the first account.
      const userCount = (await db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number }).count;
      if (userCount === 1) {
        await db.prepare("UPDATE expenses SET userId = ? WHERE userId IS NULL").run(id);
        await db.prepare("UPDATE budgets SET userId = ? WHERE userId IS NULL").run(id);
      }
    });
    res.status(201).json({
      message: "Account created. Please sign in.",
      user: await publicUser(id),
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("UNIQUE constraint failed") || (error as Error & { code?: string }).code === "23505")) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    res.status(500).json({ error: "Could not create your account." });
  }
});

router.post("/signin", async (req: Request, res: Response) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const user = await db.prepare("SELECT id, passwordHash FROM users WHERE email = ?").get(email) as { id: string; passwordHash: string } | undefined;
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }
  res.json({ user: await publicUser(user.id), token: await issueSession(user.id) });
});

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  res.json(await publicUser(req.userId!));
});

router.post("/signout", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const token = req.header("Authorization")!.slice(7);
  await db.prepare("DELETE FROM sessions WHERE tokenHash = ?").run(hashToken(token));
  res.status(204).send();
});

export default router;

