import { promises as fs } from "fs";
import path from "path";

export interface StorageProvider {
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

export class LocalStorageProvider implements StorageProvider {
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

export const storage: StorageProvider = new LocalStorageProvider();
