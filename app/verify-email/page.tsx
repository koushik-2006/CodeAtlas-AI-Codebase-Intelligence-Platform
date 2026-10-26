"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { OtpInput } from "@/components/auth/OtpInput";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle, RotateCw, Clock, MailCheck } from "lucide-react";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams?.get("email") || "";

  const { verifyOtp, resendOtp, isAuthenticated } = useAuth();

  const [email, setEmail] = useState(emailParam);
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  // Cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Email address is required.");
      return;
    }

    if (otpCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtp({
        email: email.trim(),
        otp: otpCode.trim(),
      });

      if (res.success && res.user) {
        setSuccessMessage("Email verified! Redirecting to dashboard...");
        router.push("/dashboard");
      } else {
        setErrorMessage(res.error || "Invalid verification code.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to verify code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage("Email address is required to resend code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resendOtp({ email: email.trim() });
      if (res.success) {
        setSuccessMessage(res.message || "A new 6-digit verification code has been sent.");
        setResendCooldown(res.retryAfterSeconds || 60);
      } else {
        setErrorMessage(res.error || "Unable to resend code.");
        if (res.retryAfterSeconds) setResendCooldown(res.retryAfterSeconds);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to resend code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-page)] text-[var(--text-primary)] p-6 sm:p-12 transition-colors">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-lg mx-auto w-full">
        <Link href="/" aria-label="CodeAtlas Home">
          <Logo size="md" />
        </Link>
        <ThemeToggle />
      </div>

      {/* Center Card */}
      <div className="max-w-md mx-auto w-full my-12 p-8 sm:p-10 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-2xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] grid place-items-center mb-4">
          <MailCheck className="w-6 h-6" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Verify your email
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          Enter the 6-digit confirmation code sent to your registered inbox to activate your CodeAtlas account.
        </p>

        {/* Error Notice */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-5 p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs text-red-500 flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-bold">Verification Notice</p>
              <p className="mt-0.5 opacity-90 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
              aria-label="Dismiss error"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Notice */}
        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-500 flex items-start gap-3 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-bold">Notice</p>
              <p className="mt-0.5 opacity-90 leading-relaxed">{successMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
              aria-label="Dismiss notice"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          {!emailParam && (
            <div>
              <label
                htmlFor="verify-email-input"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
              >
                Account Email
              </label>
              <input
                id="verify-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@codeatlas.dev"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          )}

          <div className="text-center pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              6-Digit Code
            </label>
            <OtpInput
              value={otpCode}
              onChange={setOtpCode}
              onComplete={() => {}}
              disabled={isSubmitting}
              hasError={Boolean(errorMessage)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otpCode.length !== 6}
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify Email</span>
            )}
          </button>
        </form>

        {/* Resend Action */}
        <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-center space-y-2">
          <p className="text-xs text-[var(--text-secondary)]">
            Didn&apos;t receive the code?
          </p>
          <button
            type="button"
            disabled={resendCooldown > 0 || isSubmitting}
            onClick={handleResend}
            className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors ${
              resendCooldown > 0 || isSubmitting
                ? "text-[var(--text-secondary)] opacity-60 cursor-not-allowed"
                : "text-[var(--primary)] hover:underline cursor-pointer"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {resendCooldown > 0 ? (
              <span>Resend code in {resendCooldown}s</span>
            ) : (
              <span>Resend verification code</span>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs font-medium text-[var(--text-secondary)]">
        &copy; {new Date().getFullYear()} CodeAtlas Platform Inc.
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-page)]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
