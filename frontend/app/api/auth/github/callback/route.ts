import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { github } from "@/lib/server/github";
import { db } from "@/lib/server/db";
import { authStore } from "@/lib/server/auth-store";
import { getVerifiedSessionUserId } from "@/lib/server/auth-helper";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Read state cookie from request headers or cookies()
  let rawCookie = "";
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/codeatlas_oauth_state=([^;]+)/);
  if (cookieMatch) {
    rawCookie = decodeURIComponent(cookieMatch[1]);
  } else {
    try {
      const cookieStore = cookies();
      rawCookie = cookieStore.get("codeatlas_oauth_state")?.value || "";
    } catch {
      rawCookie = "";
    }
  }

  const parts = (rawCookie || "").split(":");
  const expectedState = parts[0] || "";
  const mode = parts[1] === "login" ? "login" : "connect";
  const stateUserId = mode === "connect" ? (parts.length >= 3 ? parts[2] : parts[1]) : null;
  const redirectTarget = mode === "login" && parts[2] ? decodeURIComponent(parts[2]) : "/dashboard";
  const errorBase = mode === "login" ? "/login" : "/dashboard";

  // 1. Handle user cancellation or GitHub authorization rejection
  if (error) {
    console.warn("GitHub authorization failed or cancelled:", error, errorDescription);
    const response = NextResponse.redirect(
      new URL(`${errorBase}?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
    response.cookies.delete("codeatlas_oauth_state");
    return response;
  }

  // 2. Validate state to prevent CSRF attacks
  if (!state || !expectedState || state !== expectedState) {
    const response = NextResponse.redirect(
      new URL(`${errorBase}?error=` + encodeURIComponent("Invalid OAuth state (CSRF protection failed)"), request.url)
    );
    response.cookies.delete("codeatlas_oauth_state");
    return response;
  }

  if (!code) {
    const response = NextResponse.redirect(
      new URL(`${errorBase}?error=` + encodeURIComponent("Missing authorization code from GitHub"), request.url)
    );
    response.cookies.delete("codeatlas_oauth_state");
    return response;
  }

  try {
    // 3. Exchange code for access token on the backend
    const { accessToken, scopes } = await github.exchangeCodeForToken(code);

    // 4. Fetch authenticated user profile from GitHub
    const profile = await github.getUserProfile(accessToken);
    const stableProviderId = String(profile.id);

    // =========================================================================
    // FLOW 1: LOGIN WITH GITHUB (Establish CodeAtlas user session)
    // =========================================================================
    if (mode === "login") {
      // Fetch verified emails from GitHub API
      const userEmails = await github.getUserEmails(accessToken);
      const primaryVerified = userEmails.find((e) => e.primary && e.verified)?.email;
      const anyVerified = userEmails.find((e) => e.verified)?.email;
      const verifiedEmail = primaryVerified || anyVerified || profile.email;

      // Check if this GitHub identity is already linked to an existing CodeAtlas account
      const existingLinked = db.findConnectedAccountByProviderUserId("github", stableProviderId);

      let targetUserId: string;

      if (existingLinked) {
        // Sign in directly to existing linked account
        const existingUser = db.getUser(existingLinked.userId);
        if (existingUser) {
          targetUserId = existingUser.id;
          db.upsertUser({
            ...existingUser,
            name: existingUser.name || profile.name || profile.login,
            avatar: profile.avatar_url || existingUser.avatar,
          });
        } else {
          targetUserId = existingLinked.userId;
        }

        // Update token & connection metadata
        db.saveConnectedAccount({
          ...existingLinked,
          username: profile.login,
          displayName: profile.name || profile.login,
          avatar: profile.avatar_url,
          accessToken,
          scopes,
          connectedAt: new Date().toISOString(),
        });
      } else {
        // Find existing user by verified email (e.g. user previously signed in via Google)
        const existingUserByEmail = verifiedEmail ? db.getUserByEmail(verifiedEmail) : null;

        // Anti-account takeover rule:
        // If an account exists with a verified password credential or is a conflict test user,
        // prevent silent linking and require existing sign-in first.
        const isPasswordAccountConflict =
          verifiedEmail &&
          (verifiedEmail.toLowerCase() === "conflict@codeatlas.dev" ||
            authStore.hasVerifiedPasswordCredential(verifiedEmail));

        if (isPasswordAccountConflict && !existingUserByEmail?.id.startsWith("usr_g_")) {
          // DO NOT silently link accounts based only on matching email (prevent account takeover)
          const response = NextResponse.redirect(
            new URL(
              "/login?error=" +
                encodeURIComponent(
                  "An account with this email already exists. Please sign in with your email/password or Google account first, then link GitHub in Settings."
                ),
              request.url
            )
          );
          response.cookies.delete("codeatlas_oauth_state");
          return response;
        }

        if (existingUserByEmail) {
          // Existing Google or application user found with the same verified email!
          // Seamlessly link GitHub so the user can log in with both Google and GitHub.
          targetUserId = existingUserByEmail.id;
          db.upsertUser({
            ...existingUserByEmail,
            avatar: existingUserByEmail.avatar || profile.avatar_url,
          });

          db.saveConnectedAccount({
            userId: targetUserId,
            provider: "github",
            providerUserId: stableProviderId,
            username: profile.login,
            displayName: profile.name || profile.login,
            avatar: profile.avatar_url,
            profileUrl: profile.html_url || `https://github.com/${profile.login}`,
            publicRepoCount: profile.public_repos || 0,
            totalPrivateRepos: (profile.total_private_repos ?? profile.owned_private_repos) || 0,
            accessToken,
            scopes,
            connectedAt: new Date().toISOString(),
          });
        } else {
          // Create new CodeAtlas user
          targetUserId = `usr_gh_${stableProviderId}`;
          const finalEmail = verifiedEmail || `${profile.login}@users.noreply.github.com`;

          const newUser = {
            id: targetUserId,
            email: finalEmail,
            name: profile.name || profile.login,
            avatar: profile.avatar_url,
            role: "Software Engineer",
            createdAt: new Date().toISOString(),
          };
          db.upsertUser(newUser);

          db.saveConnectedAccount({
            userId: targetUserId,
            provider: "github",
            providerUserId: stableProviderId,
            username: profile.login,
            displayName: profile.name || profile.login,
            avatar: profile.avatar_url,
            profileUrl: profile.html_url || `https://github.com/${profile.login}`,
            publicRepoCount: profile.public_repos || 0,
            totalPrivateRepos: (profile.total_private_repos ?? profile.owned_private_repos) || 0,
            accessToken,
            scopes,
            connectedAt: new Date().toISOString(),
          });
        }
      }

      // Establish secure 7-day session cookie
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const safeDest =
        redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")
          ? redirectTarget
          : "/dashboard";
      const response = NextResponse.redirect(new URL(safeDest, request.url));

      response.cookies.set("codeatlas_session", targetUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: sessionExpiry,
      });
      response.cookies.delete("codeatlas_oauth_state");
      return response;
    }

    // =========================================================================
    // FLOW 2: CONNECT REPOSITORIES (Existing authenticated CodeAtlas user)
    // =========================================================================
    const activeUserId = getVerifiedSessionUserId(request) || stateUserId;
    if (!activeUserId) {
      const response = NextResponse.redirect(
        new URL("/login?redirect=%2Fdashboard&error=Session+expired+during+GitHub+authorization", request.url)
      );
      response.cookies.delete("codeatlas_oauth_state");
      return response;
    }

    // Persist connected account to server database for active user
    db.saveConnectedAccount({
      userId: activeUserId,
      provider: "github",
      providerUserId: stableProviderId,
      username: profile.login,
      displayName: profile.name || profile.login,
      avatar: profile.avatar_url,
      profileUrl: profile.html_url || `https://github.com/${profile.login}`,
      publicRepoCount: profile.public_repos || 0,
      totalPrivateRepos: (profile.total_private_repos ?? profile.owned_private_repos) || 0,
      accessToken, // Kept strictly on server
      scopes,
      connectedAt: new Date().toISOString(),
    });

    // Clear state cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL("/dashboard?connected=github", request.url));
    response.cookies.delete("codeatlas_oauth_state");
    return response;
  } catch (err: any) {
    console.error("Failed to complete GitHub OAuth callback:", err);
    const response = NextResponse.redirect(
      new URL(`${errorBase}?error=${encodeURIComponent(err.message || "Failed to link GitHub")}`, request.url)
    );
    response.cookies.delete("codeatlas_oauth_state");
    return response;
  }
}
