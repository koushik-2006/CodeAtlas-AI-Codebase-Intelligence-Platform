"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCw,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams?.get("email") || "";
  const tokenParam = searchParams?.get("token") || "";

  const { resetPassword } = useAuth();

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);
  }, [emailParam, tokenParam]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !token.trim()) {
      setErrorMessage("Email address and recovery code are required.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword,
      });

      if (res.success) {
        setSuccessMessage(
          res.message || "Password successfully reset! Redirecting to sign in..."
        );
        setTimeout(() => {
          router.push(`/login?email=${encodeURIComponent(email)}`);
        }, 1500);
      } else {
        setErrorMessage(res.error || "Failed to reset password.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to reset password.");
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
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Reset password
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          Enter the 6-digit recovery code sent to your email and create a new secure password.
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
              <p className="font-bold">Reset Notice</p>
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

        <form onSubmit={handleReset} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
            >
              Account Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@codeatlas.dev"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reset-token"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
            >
              6-Digit Recovery Code
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reset-token"
                type="text"
                required
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full pl-10 pr-4 py-2.5 font-mono text-center tracking-widest text-base font-bold rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reset-new-password"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
            >
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reset-new-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="reset-confirm-password"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="reset-confirm-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center text-xs font-medium text-[var(--text-secondary)]">
        &copy; {new Date().getFullYear()} CodeAtlas Platform Inc.
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-page)]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
