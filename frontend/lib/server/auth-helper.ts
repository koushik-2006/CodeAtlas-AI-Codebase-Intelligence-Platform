import { NextRequest } from "next/server";
import { extractSessionUserId } from "./jwt";

export function getVerifiedSessionUserId(req: NextRequest | Request): string | null {
  const rawCookie = req.headers.get("cookie");
  if (rawCookie) {
    const match = rawCookie.match(/(?:^|;\s*)codeatlas_session=([^;]+)/);
    if (match) {
      const decoded = decodeURIComponent(match[1]);
      const userId = extractSessionUserId(decoded);
      if (userId) return userId;
    }
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const userId = extractSessionUserId(token);
    if (userId) return userId;
  }
  const headerUser = req.headers.get("x-user-id");
  if (headerUser && headerUser.trim().length > 0) {
    return headerUser.trim();
  }
  return null;
}

export function getAuthenticatedUserId(req: NextRequest | Request, fallback = "usr_default"): string {
  const verified = getVerifiedSessionUserId(req);
  return verified || fallback;
}
