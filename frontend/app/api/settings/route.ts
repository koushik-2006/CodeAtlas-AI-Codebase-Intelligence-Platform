import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = "usr_default";
    const user = db.getUser(userId);
    const settings = db.getUserSettings(userId);
    const githubAccount = db.getConnectedAccount(userId, "github");

    // Detect available AI providers on the server
    const aiProviders = {
      gemini: {
        configured: Boolean(process.env.GEMINI_API_KEY),
        model: "gemini-1.5-pro",
        status: process.env.GEMINI_API_KEY ? "active" : "unconfigured",
      },
      anthropic: {
        configured: Boolean(process.env.ANTHROPIC_API_KEY),
        model: "claude-3-5-sonnet",
        status: process.env.ANTHROPIC_API_KEY ? "active" : "unconfigured",
      },
      openai: {
        configured: Boolean(process.env.OPENAI_API_KEY),
        model: "gpt-4o",
        status: process.env.OPENAI_API_KEY ? "active" : "unconfigured",
      },
      offlineAst: {
        configured: true,
        model: "Tree-sitter AST Deterministic Engine",
        status: "active",
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          avatar: user?.avatar,
          role: user?.role,
          createdAt: user?.createdAt,
        },
        settings,
        integrations: {
          github: {
            connected: Boolean(githubAccount),
            username: githubAccount?.username || null,
            scopes: githubAccount?.scopes || [],
            connectedAt: githubAccount?.connectedAt || null,
            isSandbox: githubAccount?.installationId === "sandbox_inst",
          },
          ai: aiProviders,
        },
      },
    });
  } catch (err: any) {
    console.error("Settings GET error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load user settings." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = "usr_default";

    // Update profile if profile fields are present
    if (body.profile) {
      const user = db.getUser(userId);
      if (user) {
        if (body.profile.name) user.name = String(body.profile.name).slice(0, 80);
        if (body.profile.email) user.email = String(body.profile.email).slice(0, 100);
        if (body.profile.role) user.role = String(body.profile.role).slice(0, 100);
      }
    }

    // Update AI & application preferences if present
    if (body.settings) {
      db.updateUserSettings(userId, body.settings);
    }

    const updatedSettings = db.getUserSettings(userId);
    const updatedUser = db.getUser(userId);

    return NextResponse.json({
      success: true,
      data: {
        profile: updatedUser,
        settings: updatedSettings,
      },
    });
  } catch (err: any) {
    console.error("Settings POST error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update settings." },
      { status: 500 }
    );
  }
}
