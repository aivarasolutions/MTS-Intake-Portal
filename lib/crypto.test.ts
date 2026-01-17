import { describe, it, expect, beforeAll } from "vitest";
import {
  encryptToBytea,
  decryptFromBytea,
  safeEncrypt,
  safeDecrypt,
  generateEncryptionKey,
  maskSSN,
  maskAccountNumber,
} from "./crypto";

// Set up test encryption key
beforeAll(() => {
  process.env.DATA_ENCRYPTION_KEY = generateEncryptionKey();
});

describe("Crypto utilities", () => {
  describe("encryptToBytea and decryptFromBytea", () => {
    it("should encrypt and decrypt a simple string", () => {
      const original = "123-45-6789";
      const encrypted = encryptToBytea(original);
      const decrypted = decryptFromBytea(encrypted);
      
      expect(encrypted).toBeInstanceOf(Buffer);
      expect(encrypted.length).toBeGreaterThan(original.length);
      expect(decrypted).toBe(original);
    });

    it("should encrypt and decrypt unicode characters", () => {
      const original = "Test 日本語 🔐";
      const encrypted = encryptToBytea(original);
      const decrypted = decryptFromBytea(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it("should produce different ciphertext for same plaintext (random IV)", () => {
      const original = "123-45-6789";
      const encrypted1 = encryptToBytea(original);
      const encrypted2 = encryptToBytea(original);
      
      expect(encrypted1.equals(encrypted2)).toBe(false);
    });

    it("should throw error for empty string", () => {
      expect(() => encryptToBytea("")).toThrow("Cannot encrypt empty or null value");
    });

    it("should throw error for tampered data", () => {
      const encrypted = encryptToBytea("secret");
      // Tamper with the ciphertext
      encrypted[15] = encrypted[15] ^ 0xff;
      
      expect(() => decryptFromBytea(encrypted)).toThrow();
    });

    it("should throw error for truncated data", () => {
      const encrypted = encryptToBytea("secret");
      const truncated = encrypted.subarray(0, 10);
      
      expect(() => decryptFromBytea(truncated)).toThrow("Invalid encrypted data: too short");
    });
  });

  describe("safeEncrypt and safeDecrypt", () => {
    it("should return null for null input", () => {
      expect(safeEncrypt(null)).toBeNull();
      expect(safeDecrypt(null)).toBeNull();
    });

    it("should return null for undefined input", () => {
      expect(safeEncrypt(undefined)).toBeNull();
      expect(safeDecrypt(undefined)).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(safeEncrypt("")).toBeNull();
      expect(safeEncrypt("   ")).toBeNull();
    });

    it("should encrypt and decrypt valid values", () => {
      const original = "123456789";
      const encrypted = safeEncrypt(original);
      const decrypted = safeDecrypt(encrypted);
      
      expect(encrypted).not.toBeNull();
      expect(decrypted).toBe(original);
    });
  });

  describe("generateEncryptionKey", () => {
    it("should generate a 64-character hex string", () => {
      const key = generateEncryptionKey();
      
      expect(key).toHaveLength(64);
      expect(/^[a-f0-9]+$/i.test(key)).toBe(true);
    });

    it("should generate unique keys", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe("maskSSN", () => {
    it("should mask SSN correctly", () => {
      expect(maskSSN("123-45-6789")).toBe("***-**-6789");
      expect(maskSSN("123456789")).toBe("***-**-6789");
    });

    it("should handle short input", () => {
      expect(maskSSN("123")).toBe("***-**-****");
      expect(maskSSN("")).toBe("***-**-****");
    });
  });

  describe("maskAccountNumber", () => {
    it("should mask account number correctly", () => {
      expect(maskAccountNumber("12345678")).toBe("****5678");
      expect(maskAccountNumber("1234")).toBe("****1234");
    });

    it("should handle short input", () => {
      expect(maskAccountNumber("123")).toBe("****");
      expect(maskAccountNumber("")).toBe("****");
    });
  });
});
