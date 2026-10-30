import { NextResponse } from "next/server";
import { authStore } from "@/lib/server/auth-store";
import { emailService } from "@/lib/server/email-service";
import { EmailAuthResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, purpose = "verification" } = body;

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

    const result = authStore.createOtp(email, purpose);

    if (result.error) {
      return NextResponse.json<EmailAuthResponse>(
        {
          success: false,
          error: result.error,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const userName = authStore.getUserNameByEmail(email);
    const sendRes =
      purpose === "password_reset"
        ? await emailService.sendPasswordResetEmail(
            email.trim(),
            userName,
            result.code,
            result.expiresAt
          )
        : await emailService.sendVerificationEmail(
            email.trim(),
            userName,
            result.code,
            result.expiresAt
          );

    if (!sendRes.success) {
      return NextResponse.json<EmailAuthResponse>(
        {
          success: false,
          error: sendRes.error || "Unable to deliver verification email. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json<EmailAuthResponse>({
      success: true,
      message: "A new 6-digit verification code has been sent to your email.",
      retryAfterSeconds: 60,
    });
  } catch (err: any) {
    console.error("[Resend OTP Route Error]:", err);
    return NextResponse.json<EmailAuthResponse>(
      { success: false, error: "Internal server error while resending verification code." },
      { status: 500 }
    );
  }
}
