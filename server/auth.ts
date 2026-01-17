import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { SessionUser, AuthSession } from "../shared/schema";

const SESSION_COOKIE_NAME = "mts_session";
const SESSION_EXPIRY_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createSession(userId: string, res: Response): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await storage.createSession({
    user_id: userId,
    token,
    expires_at: expiresAt,
  });

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function getSession(req: Request): Promise<AuthSession | null> {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    return null;
  }

  const session = await storage.getSessionByToken(token);

  if (!session || session.expires_at < new Date()) {
    if (session) {
      await storage.deleteSession(token);
    }
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      first_name: session.user.first_name,
      last_name: session.user.last_name,
      role: session.user.role,
    },
    token: session.token,
    expires_at: session.expires_at,
  };
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE_NAME];

  if (token) {
    await storage.deleteSession(token);
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  }
}

export function requireAuth(allowedRoles?: ("client" | "preparer" | "admin")[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const session = await getSession(req);
    
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    (req as any).session = session;
    (req as any).user = session.user;
    next();
  };
}
