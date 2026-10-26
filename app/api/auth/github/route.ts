import { NextResponse } from "next/server";
import crypto from "crypto";
import { github } from "@/lib/server/github";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isSandboxRequest = url.searchParams.get("sandbox") === "true";

  // If user requests developer sandbox mode or GitHub OAuth is not yet configured in .env.local
  if (isSandboxRequest || !github.isConfigured()) {
    if (isSandboxRequest) {
      // Connect developer sandbox account
      db.saveConnectedAccount({
        userId: "usr_default",
        provider: "github",
        username: "developer-sandbox",
        avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
        accessToken: "sandbox_demo_token_codeatlas",
        scopes: ["read:user", "repo"],
        connectedAt: new Date().toISOString(),
      });
      return NextResponse.redirect(new URL("/settings?connected=github&mode=sandbox", request.url));
    }

    // Return configuration prompt
    return NextResponse.json({
      success: false,
      isConfigured: false,
      message:
        "GitHub OAuth credentials (GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET) are not configured in .env.local. You can configure them or connect via Developer Sandbox mode.",
      sandboxUrl: "/api/auth/github?sandbox=true",
    });
  }

  // Generate cryptographically random state to protect against CSRF
  const state = crypto.randomBytes(24).toString("hex");
  const authUrl = github.getAuthorizationUrl(state);

  const response = NextResponse.redirect(authUrl);

  // Store state in an HTTP-only secure cookie for validation on callback
  response.cookies.set("codeatlas_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
