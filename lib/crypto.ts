import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.DATA_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("DATA_ENCRYPTION_KEY environment variable is not set");
  }
  
  // If key is hex-encoded (64 chars for 32 bytes), decode it
  if (key.length === 64 && /^[a-fA-F0-9]+$/.test(key)) {
    return Buffer.from(key, "hex");
  }
  
  // Otherwise hash it to get 32 bytes
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypts a string value to a Buffer suitable for storing in a BYTEA column.
 * Uses AES-256-GCM with a random IV prepended to the ciphertext.
 * Format: [12-byte IV][ciphertext][16-byte auth tag]
 */
export function encryptToBytea(plaintext: string): Buffer {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty or null value");
  }
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + encrypted data + auth tag
  return Buffer.concat([iv, encrypted, authTag]);
}

/**
 * Decrypts a Buffer from a BYTEA column back to a string.
 * Expects format: [12-byte IV][ciphertext][16-byte auth tag]
 */
export function decryptFromBytea(encryptedData: Buffer): string {
  if (!encryptedData || encryptedData.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Invalid encrypted data: too short");
  }
  
  const key = getEncryptionKey();
  
  // Extract components
  const iv = encryptedData.subarray(0, IV_LENGTH);
  const authTag = encryptedData.subarray(encryptedData.length - AUTH_TAG_LENGTH);
  const ciphertext = encryptedData.subarray(IV_LENGTH, encryptedData.length - AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  
  return decrypted.toString("utf8");
}

/**
 * Safely encrypts a value, returning null if the input is null/undefined/empty.
 */
export function safeEncrypt(value: string | null | undefined): Buffer | null {
  if (!value || value.trim() === "") {
    return null;
  }
  return encryptToBytea(value);
}

/**
 * Safely decrypts a value, returning null if the input is null/undefined.
 */
export function safeDecrypt(encryptedData: Buffer | null | undefined): string | null {
  if (!encryptedData) {
    return null;
  }
  return decryptFromBytea(encryptedData);
}

/**
 * Generates a random encryption key suitable for DATA_ENCRYPTION_KEY.
 * Returns a 64-character hex string (32 bytes).
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Masks a sensitive value for display (e.g., "***-**-1234" for SSN).
 */
export function maskSSN(ssn: string): string {
  if (!ssn || ssn.length < 4) {
    return "***-**-****";
  }
  return `***-**-${ssn.slice(-4)}`;
}

/**
 * Masks an account number for display (e.g., "****1234").
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length < 4) {
    return "****";
  }
  return `****${accountNumber.slice(-4)}`;
}
