import { NextResponse } from "next/server";
import crypto from "crypto";
import { github } from "@/lib/server/github";
import { db } from "@/lib/server/db";
import { getVerifiedSessionUserId } from "@/lib/server/auth-helper";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "connect"; // "login" | "connect"
  const isSandboxRequest = url.searchParams.get("sandbox") === "true";
  const redirectTarget = url.searchParams.get("redirect") || "/dashboard";

  // --- MODE A: LOGIN WITH GITHUB (Public, unauthenticated entrypoint) ---
  if (mode === "login") {
    // Handle Developer Sandbox request (enables local preview before GitHub OAuth App credentials are set)
    if (isSandboxRequest) {
      const sandboxUserId = "usr_gh_sandbox_dev";
      const sandboxUser = {
        id: sandboxUserId,
        email: "github.developer@codeatlas.dev",
        name: "GitHub Developer (Sandbox)",
        avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
        role: "Software Engineer",
        createdAt: new Date().toISOString(),
      };
      db.upsertUser(sandboxUser);
      db.saveConnectedAccount({
        userId: sandboxUserId,
        provider: "github",
        providerUserId: "9919",
        username: "developer-sandbox",
        displayName: sandboxUser.name,
        avatar: sandboxUser.avatar,
        profileUrl: "https://github.com/developer-sandbox",
        publicRepoCount: 14,
        totalPrivateRepos: 3,
        accessToken: "sandbox_demo_token_codeatlas",
        scopes: ["read:user", "user:email"],
        connectedAt: new Date().toISOString(),
      });

      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const safeDest =
        redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")
          ? redirectTarget
          : "/dashboard";
      const response = NextResponse.redirect(new URL(safeDest, request.url));
      response.cookies.set("codeatlas_session", sandboxUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: sessionExpiry,
      });
      return response;
    }

    if (!github.isConfigured()) {
      return NextResponse.redirect(
        new URL(
          "/login?error=" +
            encodeURIComponent(
              "GitHub OAuth is not configured on the server. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.local to enable GitHub sign-in."
            ),
          request.url
        )
      );
    }

    const rawState = crypto.randomBytes(24).toString("hex");
    // Identity & repository access scopes: read:user user:email repo
    const authUrl = github.getAuthorizationUrl(rawState, "read:user user:email repo");
    const response = NextResponse.redirect(authUrl);

    const safeRedirect =
      redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")
        ? redirectTarget
        : "/dashboard";

    response.cookies.set("codeatlas_oauth_state", `${rawState}:login:${encodeURIComponent(safeRedirect)}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  }

  // --- MODE B: CONNECT GITHUB REPOSITORIES (Protected, requires active CodeAtlas user) ---
  const userId = getVerifiedSessionUserId(request);
  if (!userId) {
    return NextResponse.redirect(
      new URL("/login?redirect=%2Fdashboard&error=Please+sign+in+first+to+connect+GitHub", request.url)
    );
  }

  // Handle Developer Sandbox request
  if (isSandboxRequest) {
    db.saveConnectedAccount({
      userId,
      provider: "github",
      username: "developer-sandbox",
      avatar: "https://avatars.githubusercontent.com/u/9919?v=4",
      accessToken: "sandbox_demo_token_codeatlas",
      scopes: ["read:user", "repo"],
      connectedAt: new Date().toISOString(),
    });
    return NextResponse.redirect(new URL("/dashboard?connected=github&mode=sandbox", request.url));
  }

  // Check if real GitHub OAuth is configured in server environment
  if (!github.isConfigured()) {
    return NextResponse.redirect(
      new URL(
        "/dashboard?error=" +
          encodeURIComponent(
            "GitHub OAuth is not configured on the server. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.local to enable real GitHub authorization."
          ),
        request.url
      )
    );
  }

  const rawState = crypto.randomBytes(24).toString("hex");
  // Repository permissions requested when connecting for codebase analysis
  const authUrl = github.getAuthorizationUrl(rawState, "read:user user:email repo");
  const response = NextResponse.redirect(authUrl);

  // Store state bound to the authenticated userId in an HTTP-only secure cookie
  response.cookies.set("codeatlas_oauth_state", `${rawState}:connect:${userId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
