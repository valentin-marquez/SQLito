import { createHash, randomBytes } from "node:crypto";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a random string for code verifier
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

// Generate a code challenge from the verifier using SHA256
export function generateCodeChallenge(verifier: string): string {
  const hash = createHash("sha256").update(verifier).digest();
  return Buffer.from(hash).toString("base64url");
}

// Generate a random state to protect against CSRF
export function generateState(): string {
  return randomBytes(16).toString("base64url");
}
