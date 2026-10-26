import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/server/db";
import { github } from "@/lib/server/github";

function getSessionUserId(req: Request): string | undefined {
  const rawCookie = req.headers.get("cookie");
  if (rawCookie) {
    const match = rawCookie.match(/(?:^|;\s*)codeatlas_session=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  try {
    return cookies().get("codeatlas_session")?.value;
  } catch {
    return undefined;
  }
}

export async function GET(req: Request) {
  const sessionUserId = getSessionUserId(req);
  const headerUserId = req.headers.get("x-user-id");
  const isAuthenticated = Boolean(sessionUserId || headerUserId);
  const activeUserId = sessionUserId || headerUserId;

  const user = activeUserId ? db.getUser(activeUserId) : null;
  const githubAccount = activeUserId ? db.getConnectedAccount(activeUserId, "github") : null;

  return NextResponse.json({
    success: true,
    isAuthenticated,
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        }
      : null,
    auth: {
      google: {
        connected: isAuthenticated, // Primary sign-in provider
        email: user?.email || null,
      },
      github: {
        connected: Boolean(githubAccount),
        username: githubAccount?.username || null,
        avatar: githubAccount?.avatar || null,
        scopes: githubAccount?.scopes || [],
        connectedAt: githubAccount?.connectedAt || null,
        isConfigured: github.isConfigured(),
      },
    },
  });
}

export async function POST(req: Request) {
  const res = NextResponse.json({ success: true, message: "Logged out successfully." });
  res.cookies.set("codeatlas_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}

export async function DELETE(req: Request) {
  const res = NextResponse.json({ success: true, message: "Logged out successfully." });
  res.cookies.set("codeatlas_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return res;
}

