import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/server/db";
import { github } from "@/lib/server/github";
import { extractSessionUserId, verifyAndDecodeJwtToken } from "@/lib/server/jwt";

function getSessionToken(req: Request): string | undefined {
  const rawCookie = req.headers.get("cookie");
  if (rawCookie) {
    const match = rawCookie.match(/(?:^|;\s*)codeatlas_session=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  try {
    return cookies().get("codeatlas_session")?.value;
  } catch {
    return undefined;
  }
}

export async function GET(req: Request) {
  const token = getSessionToken(req);
  const headerUserId = req.headers.get("x-user-id");

  let activeUserId: string | null = null;

  if (token) {
    const payload = verifyAndDecodeJwtToken(token);
    if (payload && payload.sub) {
      activeUserId = payload.sub;
      let existingUser = db.getUser(payload.sub);
      if (!existingUser && payload.email) {
        existingUser = {
          id: payload.sub,
          name: payload.name || payload.email.split("@")[0],
          email: payload.email,
          avatar: payload.avatar,
          role: payload.role || "Software Engineer",
          createdAt: new Date().toISOString(),
        };
        db.upsertUser(existingUser);
      }
    } else {
      activeUserId = extractSessionUserId(token);
    }
  }

  if (!activeUserId && headerUserId) {
    activeUserId = headerUserId.trim();
  }

  const isAuthenticated = Boolean(activeUserId);
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
