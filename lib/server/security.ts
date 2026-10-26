import path from "path";
import { db } from "./db";

/**
 * Validates a repository relative file path to prevent directory traversal attacks.
 * Blocks attempts to escape repository scope via `..`, absolute drive letters, or null bytes.
 */
export function validateFilePath(filePath: string): { valid: boolean; normalized?: string; error?: string } {
  if (!filePath || typeof filePath !== "string") {
    return { valid: false, error: "File path must be a non-empty string." };
  }

  // Null-byte injection check
  if (filePath.includes("\0")) {
    return { valid: false, error: "Null byte detected in file path." };
  }

  // Normalize path using POSIX forward slashes
  const normalized = filePath.replace(/\\/g, "/").trim();

  // Check for directory traversal sequences
  const segments = normalized.split("/");
  if (segments.includes("..")) {
    return { valid: false, error: "Directory traversal sequence ('..') is strictly prohibited." };
  }

  // Check for absolute root or drive letters (e.g. C:, /etc/)
  if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) {
    return { valid: false, error: "Absolute paths are prohibited. Path must be relative to repository root." };
  }

  return { valid: true, normalized };
}

/**
 * Enforces server-side authorization to verify that the requesting user owns or has public access
 * to the specified repository.
 */
export function assertRepositoryAccess(userId: string, repositoryId: string): boolean {
  if (!userId || !repositoryId) return false;
  const repo = db.getRepository(repositoryId, userId);
  if (!repo) {
    // Check if public repository
    const publicRepo = db.getRepositories().find((r) => r.id === repositoryId && r.visibility === "public");
    return Boolean(publicRepo);
  }
  return true;
}

/**
 * Mitigates prompt injection attacks in user queries by sanitizing override directives
 * and bounding input length.
 */
export function sanitizeUserPrompt(prompt: string, maxLength: number = 2000): string {
  if (!prompt || typeof prompt !== "string") return "";
  let sanitized = prompt.trim().slice(0, maxLength);

  // Neutralize common prompt injection prefixes
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /system\s*:\s*you\s+are\s+now/gi,
    /disregard\s+(the\s+)?above/gi,
    /you\s+are\s+now\s+in\s+unrestricted\s+mode/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, "[FILTERED_INJECTION_DIRECTIVE]");
  }

  return sanitized;
}

/**
 * Binds uploaded or pasted code snippet payload size to prevent resource exhaustion attacks.
 */
export function sanitizeCodePayload(code: string, maxBytes: number = 250_000): { valid: boolean; code?: string; error?: string } {
  if (!code || typeof code !== "string") {
    return { valid: false, error: "Code content cannot be empty." };
  }

  if (Buffer.byteLength(code, "utf8") > maxBytes) {
    return {
      valid: false,
      error: `Code payload exceeds maximum safe boundary of ${Math.round(maxBytes / 1024)} KB.`,
    };
  }

  return { valid: true, code };
}
