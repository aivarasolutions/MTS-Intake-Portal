import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export type SessionUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "client" | "preparer" | "admin";
};

export type Session = {
  user: SessionUser;
  token: string;
  expires_at: Date;
};

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

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await prisma.sessions.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.sessions.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expires_at < new Date()) {
    if (session) {
      await prisma.sessions.delete({ where: { id: session.id } });
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

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.sessions.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(allowedRoles: ("client" | "preparer" | "admin")[]): Promise<Session> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    if (session.user.role === "client") {
      redirect("/dashboard/client");
    } else {
      redirect("/dashboard/admin");
    }
  }
  return session;
}
