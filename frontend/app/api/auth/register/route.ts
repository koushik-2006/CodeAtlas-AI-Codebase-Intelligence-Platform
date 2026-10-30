import { NextResponse } from "next/server";
import { authStore } from "@/lib/server/auth-store";
import { emailService } from "@/lib/server/email-service";
import { EmailAuthResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "Please enter your full name (at least 2 characters)." },
        { status: 400 }
      );
    }

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

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const regResult = authStore.register(name, email, password);
    if (!regResult.success) {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: regResult.error || "Unable to create account." },
        { status: 409 }
      );
    }

    // Generate 6-digit verification code
    const otpRes = authStore.createOtp(email, "verification");

    if (otpRes.error) {
      return NextResponse.json<EmailAuthResponse>(
        {
          success: false,
          error: otpRes.error,
          retryAfterSeconds: otpRes.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // Dispatch verification email through configured email provider
    const sendRes = await emailService.sendVerificationEmail(
      email.trim(),
      name.trim(),
      otpRes.code,
      otpRes.expiresAt
    );

    if (!sendRes.success) {
      return NextResponse.json<EmailAuthResponse>(
        {
          success: false,
          error:
            sendRes.error ||
            "Unable to deliver verification email. Please check your email configuration or try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json<EmailAuthResponse>(
      {
        success: true,
        requiresVerification: true,
        email: authStore.maskEmail(email),
        message: "Account created! A 6-digit verification code has been sent to your email.",
        retryAfterSeconds: otpRes.retryAfterSeconds,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[Register Route Error]:", err);
    return NextResponse.json<EmailAuthResponse>(
      { success: false, error: "Internal server error during account creation." },
      { status: 500 }
    );
  }
}
