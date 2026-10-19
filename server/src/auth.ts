import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import db from "./db.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorization = req.header("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }
  let session: { userId: string } | undefined;
  try {
    session = await db.prepare(`
      SELECT userId FROM sessions WHERE tokenHash = ? AND expiresAt > datetime('now')
    `).get(hashToken(token)) as { userId: string } | undefined;
  } catch {
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

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let role: { role: string } | undefined;
  try { role = await db.prepare("SELECT role FROM users WHERE id = ?").get(req.userId) as { role: string } | undefined; }
  catch { res.status(500).json({ error: "Could not verify administrator access." }); return; }
  if (role?.role !== "admin") {
    res.status(403).json({ error: "Administrator access is required." });
    return;
  }
  next();
}

export function authenticatedUserId(req: AuthenticatedRequest): string {
  if (!req.userId) throw new Error("Authenticated route has no user ID.");
  return req.userId;
}
