import { NextResponse } from "next/server";
import { authStore } from "@/lib/server/auth-store";
import { EmailAuthResponse } from "@/types/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, token, newPassword } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "Recovery code or token is required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const verifyResult = authStore.verifyOtp(email, token.trim(), "password_reset");
    if (!verifyResult.valid) {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: verifyResult.error || "Invalid or expired recovery code." },
        { status: 400 }
      );
    }

    const resetResult = authStore.resetPassword(email, newPassword);
    if (!resetResult.success) {
      return NextResponse.json<EmailAuthResponse>(
        { success: false, error: resetResult.error || "Failed to update password." },
        { status: 500 }
      );
    }

    return NextResponse.json<EmailAuthResponse>({
      success: true,
      message: "Your password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (err: any) {
    console.error("[Reset Password Route Error]:", err);
    return NextResponse.json<EmailAuthResponse>(
      { success: false, error: "Internal server error while resetting password." },
      { status: 500 }
    );
  }
}
