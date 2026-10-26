import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { github } from "@/lib/server/github";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  // Handle user cancellation or GitHub authorization rejection
  if (error) {
    console.warn("GitHub authorization failed or cancelled:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  // Validate state to prevent CSRF attacks
  const cookieStore = cookies();
  const storedState = cookieStore.get("codeatlas_oauth_state")?.value;

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/settings?error=Invalid+OAuth+state+(CSRF+protection)", request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?error=Missing+authorization+code", request.url)
    );
  }

  try {
    // 1. Exchange code for access token
    const { accessToken, scopes } = await github.exchangeCodeForToken(code);

    // 2. Fetch authenticated user profile
    const profile = await github.getUserProfile(accessToken);

    // 3. Persist connected account to server database
    db.saveConnectedAccount({
      userId: "usr_default",
      provider: "github",
      username: profile.login,
      avatar: profile.avatar_url,
      accessToken, // Kept strictly on server
      scopes,
      connectedAt: new Date().toISOString(),
    });

    // 4. Clear state cookie and redirect to settings
    const response = NextResponse.redirect(new URL("/settings?connected=github", request.url));
    response.cookies.delete("codeatlas_oauth_state");
    return response;
  } catch (err: any) {
    console.error("Failed to complete GitHub OAuth callback:", err);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(err.message || "Failed to link GitHub")}`, request.url)
    );
  }
}
