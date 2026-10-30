import { NextResponse } from "next/server";
import { authStore } from "@/lib/server/auth-store";
import { emailService } from "@/lib/server/email-service";
import { EmailAuthResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Only create OTP if user actually exists, but return generic response to prevent account enumeration
    if (authStore.hasUser(email)) {
      const otpRes = authStore.createOtp(email, "password_reset");
      if (otpRes.code) {
        const userName = authStore.getUserNameByEmail(email);
        await emailService.sendPasswordResetEmail(
          email.trim(),
          userName,
          otpRes.code,
          otpRes.expiresAt
        );
      }
    }

    return NextResponse.json<EmailAuthResponse>({
      success: true,
      message:
        "If an account with that email exists, password reset instructions and a recovery code have been sent.",
    });
  } catch (err: any) {
    console.error("[Forgot Password Route Error]:", err);
    return NextResponse.json<EmailAuthResponse>(
      { success: false, error: "Internal server error while processing password reset request." },
      { status: 500 }
    );
  }
}
