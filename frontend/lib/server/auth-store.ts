import crypto from "crypto";
import fs from "fs";
import path from "path";
import { db } from "./db";
import { DbUser } from "@/types/database";

const DATA_DIR = path.join(process.cwd(), "data");
const CREDENTIALS_FILE = path.join(DATA_DIR, "auth-credentials.json");
const OTPS_FILE = path.join(DATA_DIR, "auth-otps.json");

export interface StoredCredential {
  userId: string;
  email: string;
  salt: string;
  hash: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface StoredOtp {
  code: string;
  email: string;
  purpose: "verification" | "password_reset";
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

// Global cross-route stores for Next.js App Router multi-module runtime
interface GlobalAuthStores {
  otpStore?: Map<string, StoredOtp>;
  resendRateLimitStore?: Map<string, number>;
  loginAttemptStore?: Map<string, { count: number; lockedUntil: number }>;
}

const g = globalThis as unknown as GlobalAuthStores;
const otpStore = g.otpStore || (g.otpStore = new Map<string, StoredOtp>());
const resendRateLimitStore = g.resendRateLimitStore || (g.resendRateLimitStore = new Map<string, number>());
const loginAttemptStore = g.loginAttemptStore || (g.loginAttemptStore = new Map<string, { count: number; lockedUntil: number }>());

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadOtpsFromDisk() {
  if (fs.existsSync(OTPS_FILE)) {
    try {
      const raw = fs.readFileSync(OTPS_FILE, "utf-8");
      const list: StoredOtp[] = JSON.parse(raw);
      const now = Date.now();
      for (const item of list) {
        if (item.expiresAt > now) {
          otpStore.set(`${item.email}_${item.purpose}`, item);
        }
      }
    } catch {}
  }
}

function saveOtpsToDisk() {
  ensureDir();
  const list = Array.from(otpStore.values()).filter((item) => item.expiresAt > Date.now());
  try {
    fs.writeFileSync(OTPS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {}
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

// Initial load of any active OTPs from disk
loadOtpsFromDisk();

class AuthStore {
  private credentials: Map<string, StoredCredential> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    ensureDir();

    // Initialize from disk if available
    if (fs.existsSync(CREDENTIALS_FILE)) {
      try {
        const raw = fs.readFileSync(CREDENTIALS_FILE, "utf-8");
        const list: StoredCredential[] = JSON.parse(raw);
        for (const item of list) {
          this.credentials.set(item.email.toLowerCase(), item);
        }
      } catch (err) {
        console.error("[AuthStore] Failed to parse credentials file:", err);
      }
    }

    // Ensure seed users have default developer credentials (password123)
    const seedUsers = [
      { id: "usr_default", email: "alex@codeatlas.dev", name: "Alex Mercer" },
      { id: "usr_sarah", email: "sarah@codeatlas.dev", name: "Sarah Lin" },
      { id: "usr_marcus", email: "marcus@codeatlas.dev", name: "Marcus Vance" },
      { id: "usr_elena", email: "elena@codeatlas.dev", name: "Elena Rostova" },
    ];

    for (const seed of seedUsers) {
      const emailLower = seed.email.toLowerCase();
      if (!this.credentials.has(emailLower)) {
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = hashPassword("password123", salt);
        this.credentials.set(emailLower, {
          userId: seed.id,
          email: seed.email,
          salt,
          hash,
          emailVerified: true,
          createdAt: new Date().toISOString(),
        });
      }
    }

    this.save();
    this.initialized = true;
  }

  private save() {
    ensureDir();
    const list = Array.from(this.credentials.values());
    try {
      fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch (e) {
      // Ignore disk write errors in restricted or static export environments
    }
  }

  /**
   * Masks email for secure presentation (e.g. j***e@example.com)
   */
  maskEmail(email: string): string {
    const [local, domain] = email.trim().toLowerCase().split("@");
    if (!domain) return email;
    if (local.length <= 2) {
      return `${local[0]}*@${domain}`;
    }
    const visibleStart = local[0];
    const visibleEnd = local[local.length - 1];
    const stars = "*".repeat(Math.min(local.length - 2, 4));
    return `${visibleStart}${stars}${visibleEnd}@${domain}`;
  }

  /**
   * Verifies user credentials
   */
  verifyCredentials(email: string, password: string): {
    valid: boolean;
    user?: DbUser;
    requiresVerification?: boolean;
    error?: string;
  } {
    this.init();
    const emailLower = email.trim().toLowerCase();
    const cred = this.credentials.get(emailLower);

    // Enforce brute force protection
    const attempt = loginAttemptStore.get(emailLower);
    const now = Date.now();
    if (attempt && attempt.lockedUntil > now) {
      const waitSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
      return {
        valid: false,
        error: `Too many failed login attempts. Please try again in ${waitSeconds} seconds.`,
      };
    }

    if (!cred) {
      // Record failed attempt
      this.recordFailedAttempt(emailLower);
      return { valid: false, error: "Invalid email or password." };
    }

    const testHash = hashPassword(password, cred.salt);
    const bufferA = Buffer.from(testHash, "hex");
    const bufferB = Buffer.from(cred.hash, "hex");

    if (bufferA.length !== bufferB.length || !crypto.timingSafeEqual(bufferA, bufferB)) {
      this.recordFailedAttempt(emailLower);
      return { valid: false, error: "Invalid email or password." };
    }

    // Reset failed attempts on success
    loginAttemptStore.delete(emailLower);

    // Retrieve or create user record in Member 2's db
    let user = db.getUser(cred.userId);
    if (!user) {
      user = {
        id: cred.userId,
        email: cred.email,
        name: cred.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        role: "Software Engineer",
        createdAt: cred.createdAt,
      };
      db.upsertUser(user);
    }

    if (!cred.emailVerified) {
      return {
        valid: false,
        requiresVerification: true,
        user,
        error: "Email verification required before signing in.",
      };
    }

    return { valid: true, user };
  }

  private recordFailedAttempt(emailLower: string) {
    const attempt = loginAttemptStore.get(emailLower) || { count: 0, lockedUntil: 0 };
    attempt.count += 1;
    if (attempt.count >= 5) {
      attempt.lockedUntil = Date.now() + 5 * 60 * 1000; // 5 min lockout
    }
    loginAttemptStore.set(emailLower, attempt);
  }

  /**
   * Checks whether a verified account with this email already exists
   */
  hasVerifiedAccount(email: string): boolean {
    this.init();
    if (!email) return false;
    const emailLower = email.trim().toLowerCase();
    const cred = this.credentials.get(emailLower);
    if (cred && cred.emailVerified) return true;
    const dbUser = db.getUserByEmail(emailLower);
    return Boolean(dbUser);
  }

  /**
   * Checks whether an account with a verified password credential exists
   */
  hasVerifiedPasswordCredential(email: string): boolean {
    this.init();
    if (!email) return false;
    const emailLower = email.trim().toLowerCase();
    const cred = this.credentials.get(emailLower);
    return Boolean(cred && cred.emailVerified);
  }

  /**
   * Registers a new user with unverified state
   */
  register(name: string, email: string, password: string): {
    success: boolean;
    userId?: string;
    error?: string;
  } {
    this.init();
    const emailLower = email.trim().toLowerCase();

    if (this.credentials.has(emailLower)) {
      const existing = this.credentials.get(emailLower)!;
      if (existing.emailVerified) {
        return { success: false, error: "An account with this email already exists." };
      }
      // If unverified, allow updating credentials, name, and re-verifying
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = hashPassword(password, salt);
      existing.salt = salt;
      existing.hash = hash;
      this.save();

      // Ensure user profile in db reflects latest name
      db.upsertUser({
        id: existing.userId,
        email: email.trim(),
        name: name.trim(),
        role: "Software Engineer",
        createdAt: existing.createdAt,
      });

      return { success: true, userId: existing.userId };
    }

    const userId = `usr_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`;
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = hashPassword(password, salt);

    const credential: StoredCredential = {
      userId,
      email: email.trim(),
      salt,
      hash,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };

    this.credentials.set(emailLower, credential);
    this.save();

    // Register user in Member 2's db
    const newUser: DbUser = {
      id: userId,
      email: email.trim(),
      name: name.trim(),
      role: "Software Engineer",
      createdAt: new Date().toISOString(),
    };
    db.upsertUser(newUser);

    return { success: true, userId };
  }

  /**
   * Generates a 6-digit OTP code for email verification or password reset
   */
  createOtp(
    email: string,
    purpose: "verification" | "password_reset" = "verification"
  ): {
    code: string;
    expiresAt: number;
    error?: string;
    retryAfterSeconds?: number;
  } {
    const emailLower = email.trim().toLowerCase();
    const rateLimitKey = `${emailLower}_${purpose}`;
    const lastSent = resendRateLimitStore.get(rateLimitKey);
    const now = Date.now();

    // 60-second cooldown
    if (lastSent && now - lastSent < 60000) {
      const waitSeconds = Math.ceil((60000 - (now - lastSent)) / 1000);
      return {
        code: "",
        expiresAt: 0,
        error: `Please wait ${waitSeconds}s before requesting a new code.`,
        retryAfterSeconds: waitSeconds,
      };
    }

    // Generate cryptographically secure 6-digit integer
    const code = crypto.randomInt(100000, 1000000).toString();
    const lifespanMs = purpose === "verification" ? 10 * 60 * 1000 : 15 * 60 * 1000;
    const expiresAt = now + lifespanMs;

    const otpData: StoredOtp = {
      code,
      email: emailLower,
      purpose,
      expiresAt,
      attempts: 0,
      createdAt: now,
    };

    otpStore.set(rateLimitKey, otpData);
    saveOtpsToDisk();
    resendRateLimitStore.set(rateLimitKey, now);

    // Log in development for testing convenience
    if (process.env.NODE_ENV !== "production") {
      console.log(`[CodeAtlas Auth Server] Generated ${purpose} OTP for ${emailLower}: ${code}`);
    }

    return { code, expiresAt };
  }

  /**
   * Validates a submitted 6-digit OTP
   */
  verifyOtp(
    email: string,
    inputCode: string,
    purpose: "verification" | "password_reset" = "verification"
  ): {
    valid: boolean;
    error?: string;
    attemptsRemaining?: number;
  } {
    const emailLower = email.trim().toLowerCase();
    const rateLimitKey = `${emailLower}_${purpose}`;
    let stored = otpStore.get(rateLimitKey);

    if (!stored) {
      loadOtpsFromDisk();
      stored = otpStore.get(rateLimitKey);
    }

    if (!stored) {
      return {
        valid: false,
        error: "No active verification code found. Please request a new code.",
      };
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(rateLimitKey);
      saveOtpsToDisk();
      return {
        valid: false,
        error: "Verification code has expired. Please request a new code.",
      };
    }

    stored.attempts += 1;
    saveOtpsToDisk();

    // Check maximum attempts
    if (stored.attempts > 5) {
      otpStore.delete(rateLimitKey);
      saveOtpsToDisk();
      return {
        valid: false,
        error: "Too many failed attempts. This code has been invalidated.",
      };
    }

    // Constant time string comparison
    const cleanInput = inputCode.trim();
    const bufferA = Buffer.from(cleanInput);
    const bufferB = Buffer.from(stored.code);

    const matches = bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB);

    if (!matches) {
      const attemptsRemaining = Math.max(0, 5 - stored.attempts);
      return {
        valid: false,
        error: "Invalid verification code. Please check and try again.",
        attemptsRemaining,
      };
    }

    // Valid code: consume OTP
    otpStore.delete(rateLimitKey);
    saveOtpsToDisk();

    // If verification purpose, mark user email as verified
    if (purpose === "verification") {
      this.init();
      const cred = this.credentials.get(emailLower);
      if (cred) {
        cred.emailVerified = true;
        this.save();
      }
    }

    return { valid: true };
  }

  /**
   * Resets user password using verified recovery context
   */
  resetPassword(email: string, newPassword: string): { success: boolean; error?: string } {
    this.init();
    const emailLower = email.trim().toLowerCase();
    const cred = this.credentials.get(emailLower);

    if (!cred) {
      return { success: false, error: "Unable to reset password for this email." };
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const hash = hashPassword(newPassword, salt);
    cred.salt = salt;
    cred.hash = hash;
    cred.emailVerified = true; // Recovering account confirms email access
    this.save();

    return { success: true };
  }

  /**
   * Checks if user exists
   */
  hasUser(email: string): boolean {
    this.init();
    return this.credentials.has(email.trim().toLowerCase());
  }

  /**
   * Retrieves userId associated with an email
   */
  getUserIdByEmail(email: string): string | undefined {
    this.init();
    return this.credentials.get(email.trim().toLowerCase())?.userId;
  }

  /**
   * Retrieves the user's display name or email prefix
   */
  getUserNameByEmail(email: string): string {
    this.init();
    const userId = this.getUserIdByEmail(email);
    if (userId) {
      const u = db.getUser(userId);
      if (u?.name) return u.name;
    }
    const local = email.split("@")[0] || "Developer";
    return local.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * For testing purposes only: clears in-memory OTP stores
   */
  resetTestStores(): void {
    otpStore.clear();
    resendRateLimitStore.clear();
    loginAttemptStore.clear();
    saveOtpsToDisk();
  }
}

export const authStore = new AuthStore();
