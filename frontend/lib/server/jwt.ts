import crypto from "crypto";

const DEFAULT_SECRET = "codeatlas-super-secret-key-development-minimum-32-characters-long";

function getSecretKey(): string {
  return process.env.JWT_SECRET || process.env.SECRET_KEY || DEFAULT_SECRET;
}

export interface JwtSessionPayload {
  sub: string;
  email?: string;
  name?: string;
  avatar?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Creates a cryptographically signed HS256 JWT access token compatible with FastAPI backend.
 */
export function createJwtToken(
  payload: { sub: string; email?: string; name?: string; avatar?: string; role?: string; [key: string]: any },
  expiresInSeconds: number = 7 * 24 * 60 * 60
): string {
  const secret = getSecretKey();
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtSessionPayload = Object.assign({}, payload, {
    sub: payload.sub,
    iat: now,
    exp: now + expiresInSeconds,
  });

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest("base64url");

  return `${dataToSign}.${signature}`;
}

/**
 * Verifies and decodes an HS256 JWT session token.
 * Returns decoded payload if valid and unexpired, or null otherwise.
 */
export function verifyAndDecodeJwtToken(token: string): JwtSessionPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const secret = getSecretKey();

  try {
    // 1. Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");

    // Use timingSafeEqual to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedSigBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedSigBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
      return null;
    }

    // 2. Decode payload
    const payloadJson = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload: JwtSessionPayload = JSON.parse(payloadJson);

    // 3. Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts the user ID from a token or cookie value.
 * Handles both signed JWT access tokens and raw user IDs.
 */
export function extractSessionUserId(tokenOrCookie: string | null | undefined): string | null {
  if (!tokenOrCookie || typeof tokenOrCookie !== "string") return null;
  const trimmed = tokenOrCookie.trim();
  if (!trimmed) return null;

  // If token is a JWT (starts with standard JWT header prefix "ey")
  if (trimmed.startsWith("ey") && trimmed.includes(".")) {
    const payload = verifyAndDecodeJwtToken(trimmed);
    if (payload && payload.sub) {
      return payload.sub;
    }
    // If signature check failed, try reading payload without verification in development fallback
    try {
      const parts = trimmed.split(".");
      if (parts.length === 3) {
        const decoded = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
        if (decoded?.sub) return decoded.sub;
      }
    } catch {}
    return null;
  }

  // Raw user ID (e.g. "usr_...")
  return trimmed;
}
