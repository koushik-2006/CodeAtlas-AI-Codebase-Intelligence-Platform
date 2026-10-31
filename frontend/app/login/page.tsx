"use client";

import { isDemoMode } from "@/lib/demo/mock-api";
import { isFirebaseConfigured } from "@/lib/firebase";
import Link from "next/link";
import Logo from "@/components/Logo";
import City from "@/components/City";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { GitHubSignInButton } from "@/components/auth/GitHubSignInButton";
import { OtpInput } from "@/components/auth/OtpInput";
import {
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  RotateCw,
  Clock,
  ArrowRight,
} from "lucide-react";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AuthMode =
  | "signin"
  | "register"
  | "verify_otp"
  | "verify_email_link"
  | "forgot_password"
  | "reset_password";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect");
  const modeParam = searchParams?.get("mode");
  const emailParam = searchParams?.get("email");
  const errorParam = searchParams?.get("error");

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const {
    user,
    logout,
    loginWithGoogle,
    loginWithGitHub,
    loginWithCredentials,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    checkEmailVerified,
    resendEmailVerification,
    enterDemoMode,
    isAuthenticated,
    isLoading: authChecking,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    if (modeParam === "register") setMode("register");
    else if (modeParam === "verify") setMode(isFirebaseConfigured ? "verify_email_link" : "verify_otp");
    else if (modeParam === "forgot") setMode("forgot_password");
    else if (modeParam === "reset") setMode("reset_password");

    if (emailParam) setEmail(emailParam);
    if (errorParam) setErrorMessage(decodeURIComponent(errorParam));
  }, [modeParam, emailParam, errorParam]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const completeAuthSuccess = () => {
    const target =
      redirectTarget &&
      redirectTarget.startsWith("/") &&
      !redirectTarget.startsWith("//") &&
      !redirectTarget.includes(":")
        ? redirectTarget
        : "/dashboard";
    router.replace(target);
  };

  useEffect(() => {
    if (isAuthenticated && !authChecking && !isSubmitting) {
      completeAuthSuccess();
    }
  }, [isAuthenticated, authChecking, isSubmitting]);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithCredentials({ email: email.trim(), password });
      if (res.success && res.user) {
        completeAuthSuccess();
      } else if (res.requiresVerification) {
        setMaskedEmail(email.trim());
        if (isFirebaseConfigured) {
          setMode("verify_email_link");
          setErrorMessage(
            res.error || "Please verify your email address before signing in. Check your inbox and spam folder."
          );
        } else {
          setMode("verify_otp");
          setErrorMessage(res.error || "Please verify your email address to continue.");
        }
      } else {
        setErrorMessage(res.error || "Incorrect email or password.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      setErrorMessage("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (res.success) {
        setMaskedEmail(res.email || email.trim());
        if (isFirebaseConfigured) {
          setMode("verify_email_link");
          setSuccessMessage(
            res.message || "We sent a verification link to your email. Check your inbox and spam folder."
          );
        } else if (res.requiresVerification) {
          setMode("verify_otp");
          setSuccessMessage(res.message || "Account created! A 6-digit verification code has been sent.");
        } else {
          completeAuthSuccess();
        }
      } else {
        setErrorMessage(res.error || "Unable to create account. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearMessages();

    if (otpCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtp({
        email: (maskedEmail || email).trim(),
        otp: otpCode.trim(),
      });

      if (res.success && res.user) {
        setSuccessMessage("Email verified! Redirecting to dashboard...");
        completeAuthSuccess();
      } else {
        setErrorMessage(res.error || "Invalid verification code.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckEmailVerified = async () => {
    clearMessages();
    setIsSubmitting(true);
    try {
      const res = await checkEmailVerified();
      if (res.verified) {
        setSuccessMessage("Email verified! Redirecting to dashboard...");
        setTimeout(() => completeAuthSuccess(), 300);
      } else {
        setErrorMessage(
          res.error || "Email is not yet verified. Please click the link in your email first, then continue."
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Verification check failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    clearMessages();
    setIsSubmitting(true);
    try {
      const res = await resendEmailVerification();
      if (res.success) {
        setSuccessMessage(res.message || "A new verification link has been sent. Check Spam too!");
        setResendCooldown(60);
      } else {
        setErrorMessage(res.error || "Unable to resend email.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to resend verification email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPassword({ email: email.trim() });
      if (res.success) {
        setSuccessMessage(
          res.message || "Password reset link sent to your email! Check your inbox and spam folder."
        );
      } else {
        setErrorMessage(res.error || "Failed to request password reset.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Password reset request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !resetToken.trim()) {
      setErrorMessage("Email and reset token are required.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword({
        email: email.trim(),
        token: resetToken.trim(),
        newPassword,
      });

      if (res.success) {
        setSuccessMessage(res.message || "Password reset successfully! Please sign in.");
        setMode("signin");
      } else {
        setErrorMessage(res.error || "Failed to reset password.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Password reset failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    clearMessages();
    setIsSubmitting(true);
    try {
      const res = await loginWithGoogle();
      if (res.success && res.user) {
        completeAuthSuccess();
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Google sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGitHubSignInClick = async () => {
    clearMessages();
    setIsSubmitting(true);
    try {
      const res = await loginWithGitHub();
      if (res.success && res.user) {
        completeAuthSuccess();
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "GitHub sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = () => {
    enterDemoMode();
    completeAuthSuccess();
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors">
      {/* Left Form Panel */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-16 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="CodeAtlas home"
            className="flex items-center cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] group"
          >
            <Logo size="md" />
          </Link>
          <ThemeToggle />
        </div>

        <div className="my-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Active Session Notice when already logged in */}
          {isAuthenticated && user && (
            <div className="mb-6 p-4 rounded-2xl border border-[var(--primary)]/40 bg-[var(--primary)]/10 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.avatar}
                    alt={user.name || "User Avatar"}
                    className="w-10 h-10 rounded-full object-cover border border-[var(--primary)]/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm">
                    {user.name?.[0] || "U"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[var(--text-secondary)]">Currently signed in as</p>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{user.name || user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={completeAuthSuccess}
                  className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] transition-all shadow-sm"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                  }}
                  className="flex-1 sm:flex-none text-center px-3.5 py-2 rounded-xl border border-[var(--border-color)] font-semibold text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Demo Mode Quick Access Banner */}
          <div className="p-4 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[var(--primary)] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Explore without signing in</p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Instant live demo mode with preloaded repositories and intelligence tools
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoAccess}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--primary)] text-white font-bold text-xs hover:bg-[var(--primary-hover)] transition-all shadow-sm shrink-0 whitespace-nowrap"
            >
              Explore live demo →
            </button>
          </div>

          {/* Alerts / Error & Success Banners */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Mode-specific Forms */}
          {mode === "signin" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Sign in to CodeAtlas</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  AI-Powered Codebase Intelligence Platform
                </p>
              </div>

              {/* OAuth Providers */}
              <div className="space-y-3">
                <GoogleSignInButton
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  onClick={handleGoogleSignInClick}
                  onCredential={() => {}}
                  onError={(err) => setErrorMessage(err)}
                />

                <GitHubSignInButton
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  onClick={handleGitHubSignInClick}
                  redirectTarget={redirectTarget || "/dashboard"}
                />

                {!isFirebaseConfigured && (
                  <p className="text-[11px] text-center text-[var(--text-muted)]">
                    OAuth requires full backend or Firebase deployment.
                  </p>
                )}
              </div>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[var(--border-color)] w-full" />
                <span className="bg-[var(--bg-page)] px-3 text-[11px] font-mono uppercase text-[var(--text-muted)] tracking-wider absolute">
                  or sign in with email
                </span>
              </div>

              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="developer@example.com"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all"
                    />
                    <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setMode("forgot_password");
                      }}
                      className="text-xs text-[var(--primary)] hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all"
                    />
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-[var(--primary)] text-white font-bold text-sm hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? <RotateCw className="w-4 h-4 animate-spin" /> : null}
                  <span>Sign In</span>
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-xs text-[var(--text-secondary)]">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode("register");
                    }}
                    className="font-bold text-[var(--primary)] hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  Get full access to CodeAtlas code intelligence tools
                </p>
              </div>

              {/* OAuth Providers for registration */}
              <div className="space-y-3">
                <GoogleSignInButton
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  onClick={handleGoogleSignInClick}
                  onCredential={() => {}}
                  onError={(err) => setErrorMessage(err)}
                />

                <GitHubSignInButton
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  onClick={handleGitHubSignInClick}
                  redirectTarget={redirectTarget || "/dashboard"}
                />
              </div>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[var(--border-color)] w-full" />
                <span className="bg-[var(--bg-page)] px-3 text-[11px] font-mono uppercase text-[var(--text-muted)] tracking-wider absolute">
                  or sign up with email
                </span>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all"
                    />
                    <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="developer@example.com"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all"
                    />
                    <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all"
                    />
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all"
                    />
                    <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="rounded border-[var(--border-color)]"
                  />
                  <label htmlFor="terms" className="text-xs text-[var(--text-secondary)]">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-[var(--primary)] text-white font-bold text-sm hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? <RotateCw className="w-4 h-4 animate-spin" /> : null}
                  <span>Create Account</span>
                </button>
              </form>

              <div className="text-center pt-2">
                <p className="text-xs text-[var(--text-secondary)]">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode("signin");
                    }}
                    className="font-bold text-[var(--primary)] hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Firebase Email Verification Screen */}
          {mode === "verify_email_link" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <Mail className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold">Check your inbox</h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  We sent a verification link to{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {maskedEmail || email || "your email address"}
                  </span>
                  .
                  <br />
                  <span className="text-xs text-[var(--text-muted)]">
                    (Check your Spam or Junk folder too)
                  </span>
                </p>

                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCheckEmailVerified}
                    className="w-full h-11 rounded-xl bg-[var(--primary)] text-white font-bold text-sm hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>I&apos;ve verified, continue</span>
                  </button>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting || resendCooldown > 0}
                      onClick={handleResendVerificationEmail}
                      className="text-xs font-semibold text-[var(--primary)] hover:underline disabled:opacity-50"
                    >
                      {resendCooldown > 0
                        ? `Resend email (${resendCooldown}s)`
                        : "Resend email"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setMode("signin");
                      }}
                      className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legacy OTP Verification Screen (Fallback for backend mode) */}
          {mode === "verify_otp" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Verify your email</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  Enter the 6-digit verification code sent to {maskedEmail || email}
                </p>
              </div>

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
                <div className="flex justify-center">
                  <OtpInput
                    value={otpCode}
                    onChange={setOtpCode}
                    onComplete={() => handleVerifyOtpSubmit()}
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.length !== 6}
                  className="w-full h-11 rounded-xl bg-[var(--primary)] text-white font-bold text-sm hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? <RotateCw className="w-4 h-4 animate-spin" /> : null}
                  <span>Verify Code & Continue</span>
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode("signin");
                  }}
                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {mode === "forgot_password" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Reset password</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  Enter your registered email address to receive password reset instructions
                </p>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="developer@example.com"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all"
                    />
                    <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-[var(--primary)] text-white font-bold text-sm hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? <RotateCw className="w-4 h-4 animate-spin" /> : null}
                  <span>Send Reset Link</span>
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode("signin");
                  }}
                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {mode === "reset_password" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Set new password</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  Create a new secure password for your CodeAtlas account
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    Recovery Code / Token
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Reset token"
                    className="w-full h-11 px-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    New Password
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-[var(--primary)] text-white font-bold text-sm hover:bg-[var(--primary-hover)] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? <RotateCw className="w-4 h-4 animate-spin" /> : null}
                  <span>Update Password</span>
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode("signin");
                  }}
                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <p>© {new Date().getFullYear()} CodeAtlas Intelligence</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* Right Visualization Hero Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[var(--bg-surface)] border-l border-[var(--border-color)] relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero-Trust Architectural Intelligence
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Explore and comprehend any codebase in minutes.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
            Multi-repo AST graph modeling, AI-assisted debugging, automated PR reviews, and change impact prediction.
          </p>
        </div>

        <div className="my-auto py-8">
          <City />
        </div>

        <div className="relative z-10 text-xs text-[var(--text-muted)] font-mono">
          CodeAtlas Engine v2.4 • Client-Side Static Architecture
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
