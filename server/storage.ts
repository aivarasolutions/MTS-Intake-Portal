import { prisma } from "../lib/prisma";
import type { User, Session, InsertUser, InsertSession, SessionUser } from "../shared/schema";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { objectStorageClient } from "./replit_integrations/object_storage";

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

async function ensureUploadDir(subdir?: string): Promise<string> {
  const targetDir = subdir ? path.join(UPLOAD_DIR, subdir) : UPLOAD_DIR;
  try {
    await fs.access(targetDir);
  } catch {
    await fs.mkdir(targetDir, { recursive: true });
  }
  return targetDir;
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

  async uploadToIntake(file: Buffer, filename: string, intakeId: string, _mimeType?: string): Promise<{ storedFilename: string; storageKey: string }> {
    const targetDir = await ensureUploadDir(intakeId);
    const ext = path.extname(filename);
    const storedFilename = `${crypto.randomUUID()}${ext}`;
    const storageKey = `uploads/${intakeId}/${storedFilename}`;
    const fullPath = path.join(targetDir, storedFilename);
    await fs.writeFile(fullPath, file);
    return { storedFilename, storageKey };
  }

  async downloadByKey(storageKey: string): Promise<Buffer> {
    const fullPath = path.join(process.cwd(), storageKey);
    return fs.readFile(fullPath);
  }

  async deleteByKey(storageKey: string): Promise<void> {
    const fullPath = path.join(process.cwd(), storageKey);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  async existsByKey(storageKey: string): Promise<boolean> {
    const fullPath = path.join(process.cwd(), storageKey);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
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

export class CloudFileStorage implements FileStorageProvider {
  private bucketName: string;
  private privateDir: string;
  private localFallback: LocalFileStorage;

  constructor() {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    const privateDir = process.env.PRIVATE_OBJECT_DIR;
    this.localFallback = new LocalFileStorage();
    
    if (!bucketId || !privateDir) {
      console.warn("Object storage not configured, falling back to local storage");
      this.bucketName = "";
      this.privateDir = "";
    } else {
      const parts = privateDir.split("/").filter(p => p);
      this.bucketName = parts[0] || "";
      this.privateDir = parts.slice(1).join("/");
    }
  }

  isConfigured(): boolean {
    return !!this.bucketName;
  }

  private isLocalStorageKey(storageKey: string): boolean {
    return storageKey.startsWith("uploads/") || (!storageKey.startsWith("/") && !storageKey.includes(this.bucketName));
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
    const bucket = objectStorageClient.bucket(this.bucketName);
    const storedFilename = `${crypto.randomUUID()}_${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const objectPath = `${this.privateDir}/files/${storedFilename}`;
    const gcsFile = bucket.file(objectPath);
    
    await gcsFile.save(file, {
      metadata: { contentType: mimeType },
    });
    
    return `/${this.bucketName}/${objectPath}`;
  }

  async uploadToIntake(file: Buffer, filename: string, intakeId: string, mimeType: string): Promise<{ storedFilename: string; storageKey: string }> {
    const bucket = objectStorageClient.bucket(this.bucketName);
    const ext = path.extname(filename);
    const storedFilename = `${crypto.randomUUID()}${ext}`;
    const objectPath = `${this.privateDir}/intakes/${intakeId}/${storedFilename}`;
    const storageKey = `/${this.bucketName}/${objectPath}`;
    const gcsFile = bucket.file(objectPath);
    
    await gcsFile.save(file, {
      metadata: { contentType: mimeType },
    });
    
    return { storedFilename, storageKey };
  }

  async downloadByKey(storageKey: string): Promise<Buffer> {
    if (this.isLocalStorageKey(storageKey)) {
      return this.localFallback.downloadByKey(storageKey);
    }
    const { bucketName, objectName } = this.parseStorageKey(storageKey);
    const bucket = objectStorageClient.bucket(bucketName);
    const gcsFile = bucket.file(objectName);
    const [contents] = await gcsFile.download();
    return contents;
  }

  async deleteByKey(storageKey: string): Promise<void> {
    if (this.isLocalStorageKey(storageKey)) {
      return this.localFallback.deleteByKey(storageKey);
    }
    try {
      const { bucketName, objectName } = this.parseStorageKey(storageKey);
      const bucket = objectStorageClient.bucket(bucketName);
      const gcsFile = bucket.file(objectName);
      await gcsFile.delete();
    } catch (error) {
      console.error("Error deleting file from cloud storage:", error);
    }
  }

  async existsByKey(storageKey: string): Promise<boolean> {
    if (this.isLocalStorageKey(storageKey)) {
      return this.localFallback.existsByKey(storageKey);
    }
    try {
      const { bucketName, objectName } = this.parseStorageKey(storageKey);
      const bucket = objectStorageClient.bucket(bucketName);
      const gcsFile = bucket.file(objectName);
      const [exists] = await gcsFile.exists();
      return exists;
    } catch {
      return false;
    }
  }

  async download(filepath: string): Promise<Buffer> {
    return this.downloadByKey(filepath);
  }

  async delete(filepath: string): Promise<void> {
    return this.deleteByKey(filepath);
  }

  async exists(filepath: string): Promise<boolean> {
    return this.existsByKey(filepath);
  }

  getUrl(filepath: string): string {
    return `/api/files/${encodeURIComponent(filepath)}`;
  }

  private parseStorageKey(storageKey: string): { bucketName: string; objectName: string } {
    let key = storageKey;
    if (key.startsWith("/")) {
      key = key.slice(1);
    }
    const parts = key.split("/");
    const bucketName = parts[0];
    const objectName = parts.slice(1).join("/");
    return { bucketName, objectName };
  }
}

export const storage = new DatabaseStorage();

const cloudStorage = new CloudFileStorage();
export const fileStorage: FileStorageProvider = cloudStorage.isConfigured() ? cloudStorage : new LocalFileStorage();
