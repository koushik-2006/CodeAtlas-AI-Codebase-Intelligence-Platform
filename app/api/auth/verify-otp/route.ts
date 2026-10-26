import { NextResponse } from "next/server";
import { authStore } from "@/lib/server/auth-store";
import { db } from "@/lib/server/db";
import { EmailAuthResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, otp, purpose = "verification" } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string") {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "Verification code is required." },
        { status: 400 }
      );
    }

    const cleanOtp = otp.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "Verification code must be exactly 6 digits." },
        { status: 400 }
      );
    }

    const result = authStore.verifyOtp(email, cleanOtp, purpose);
    if (!result.valid) {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: result.error || "Invalid verification code." },
        { status: 400 }
      );
    }

    // Locate verified user in Member 2's db
    const emailLower = email.trim().toLowerCase();
    const userId = authStore.getUserIdByEmail(emailLower);
    let user = userId ? db.getUser(userId) : null;

    if (!user) {
      user = db.getUser("usr_default");
    }

    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const resolvedUser = user || {
      id: userId || `usr_${Date.now().toString(36)}`,
      email: email.trim(),
      name: email.split("@")[0],
      role: "Software Engineer",
      createdAt: new Date().toISOString(),
    };

    const response = NextResponse.json<EmailAuthResponse>({
      success: true,
      user: {
        id: resolvedUser.id,
        email: resolvedUser.email,
        name: resolvedUser.name,
        avatar: resolvedUser.avatar,
        role: resolvedUser.role || "Software Engineer",
        provider: "credentials",
      },
      session: {
        id: `sess_${Date.now()}`,
        expiresAt: sessionExpiry.toISOString(),
      },
      message: "Email verified successfully! Welcome to CodeAtlas.",
    });

    // Establish session cookie
    response.cookies.set("codeatlas_session", resolvedUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: sessionExpiry,
    });

    return response;
  } catch (err: any) {
    console.error("[Verify OTP Route Error]:", err);
    return NextResponse.json<EmailAuthResponse>(
      { success: false, error: "Internal server error during verification." },
      { status: 500 }
    );
  }
}
