/**
 * Simple encryption utilities for sensitive data
 * Note: This is a basic implementation and provides only minimal security
 * for client-side storage. For production, consider more secure methods.
 */

// A simple encryption key - in production, this should be more secure
const ENCRYPTION_KEY = "sqlito-secure-storage-key";

/**
 * Encrypts a string using AES
 * @param text Text to encrypt
 * @returns Encrypted text
 */
export function encrypt(text: string): string {
  if (!text) return "";

  try {
    // Simple XOR-based encryption (for demo purposes)
    const result = [];
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result.push(String.fromCharCode(charCode));
    }
    return btoa(result.join("")); // Base64 encode
  } catch (e) {
    console.error("Encryption failed:", e);
    return "";
  }
}

/**
 * Decrypts an encrypted string
 * @param encryptedText Text to decrypt
 * @returns Decrypted text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  try {
    const encryptedBytes = atob(encryptedText); // Base64 decode
    const result = [];

    for (let i = 0; i < encryptedBytes.length; i++) {
      const charCode =
        encryptedBytes.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result.push(String.fromCharCode(charCode));
    }

    return result.join("");
  } catch (e) {
    console.error("Decryption failed:", e);
    return "";
  }
}
