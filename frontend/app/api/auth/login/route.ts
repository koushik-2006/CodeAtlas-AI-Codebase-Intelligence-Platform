import { NextResponse } from "next/server";
import { authStore } from "@/lib/server/auth-store";
import { emailService } from "@/lib/server/email-service";
import { EmailAuthResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const verification = authStore.verifyCredentials(email, password);

    if (verification.requiresVerification) {
      // Trigger new OTP for verification
      const otpRes = authStore.createOtp(email, "verification");
      if (otpRes.code) {
        const userName = authStore.getUserNameByEmail(email);
        await emailService.sendVerificationEmail(
          email.trim(),
          userName,
          otpRes.code,
          otpRes.expiresAt
        );
      }
      return NextResponse.json<EmailAuthResponse>(
        {
          success: false,
          requiresVerification: true,
          email: authStore.maskEmail(email),
          message: "Email verification required. A 6-digit code has been sent to your email.",
          retryAfterSeconds: otpRes.retryAfterSeconds,
        },
        { status: 403 }
      );
    }

    if (!verification.valid || !verification.user) {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: verification.error || "Invalid email or password." },
        { status: 401 }
      );
    }

    const user = verification.user;
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const response = NextResponse.json<EmailAuthResponse>({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role || "Software Engineer",
        provider: "credentials",
      },
      session: {
        id: `sess_${Date.now()}`,
        expiresAt: sessionExpiry.toISOString(),
      },
      message: "Successfully signed in.",
    });

    // Set secure HttpOnly session cookie
    response.cookies.set("codeatlas_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: sessionExpiry,
    });

    return response;
  } catch (err: any) {
    console.error("[Login Route Error]:", err);
    return NextResponse.json<EmailAuthResponse>(
      { success: false, error: "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
