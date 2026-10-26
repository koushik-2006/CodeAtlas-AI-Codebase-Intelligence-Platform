import { NextRequest } from "next/server";

export function getAuthenticatedUserId(req: NextRequest | Request): string {
  const headerUser = req.headers.get("x-user-id");
  if (headerUser && headerUser.trim().length > 0) {
    return headerUser.trim();
  }
  return "usr_default";
}
