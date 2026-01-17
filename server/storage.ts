import { prisma } from "../lib/prisma";
import type { User, Session, InsertUser, InsertSession, SessionUser } from "../shared/schema";
import { promises as fs } from "fs";
import path from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<(Session & { user: User }) | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await prisma.users.findUnique({ where: { id } });
    return user ? this.mapUser(user) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await prisma.users.findUnique({ where: { email: email.toLowerCase() } });
    return user ? this.mapUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await prisma.users.create({
      data: {
        email: insertUser.email.toLowerCase(),
        password_hash: insertUser.password_hash,
        first_name: insertUser.first_name,
        last_name: insertUser.last_name,
        role: insertUser.role || "client",
      },
    });
    return this.mapUser(user);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session = await prisma.sessions.create({
      data: {
        user_id: insertSession.user_id,
        token: insertSession.token,
        expires_at: insertSession.expires_at,
      },
    });
    return this.mapSession(session);
  }

  async getSessionByToken(token: string): Promise<(Session & { user: User }) | undefined> {
    const session = await prisma.sessions.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session) return undefined;
    return {
      ...this.mapSession(session),
      user: this.mapUser(session.user),
    };
  }

  async deleteSession(token: string): Promise<void> {
    await prisma.sessions.deleteMany({ where: { token } });
  }

  async deleteExpiredSessions(): Promise<void> {
    await prisma.sessions.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
  }

  private mapUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private mapSession(session: any): Session {
    return {
      id: session.id,
      user_id: session.user_id,
      token: session.token,
      expires_at: session.expires_at,
      created_at: session.created_at,
    };
  }
}

export interface FileStorageProvider {
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
  download(filepath: string): Promise<Buffer>;
  delete(filepath: string): Promise<void>;
  exists(filepath: string): Promise<boolean>;
  getUrl(filepath: string): string;
}

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export class LocalFileStorage implements FileStorageProvider {
  async upload(file: Buffer, filename: string, _mimeType: string): Promise<string> {
    await ensureUploadDir();
    const timestamp = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filepath = `${timestamp}_${safeFilename}`;
    const fullPath = path.join(UPLOAD_DIR, filepath);
    await fs.writeFile(fullPath, file);
    return filepath;
  }

  async download(filepath: string): Promise<Buffer> {
    const fullPath = path.join(UPLOAD_DIR, filepath);
    return fs.readFile(fullPath);
  }

  async delete(filepath: string): Promise<void> {
    const fullPath = path.join(UPLOAD_DIR, filepath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  async exists(filepath: string): Promise<boolean> {
    const fullPath = path.join(UPLOAD_DIR, filepath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(filepath: string): string {
    return `/api/files/${encodeURIComponent(filepath)}`;
  }
}

export const storage = new DatabaseStorage();
export const fileStorage: FileStorageProvider = new LocalFileStorage();
