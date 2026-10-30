"use client";
import { isDemoMode } from "@/lib/demo/mock-api";



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

  KeyRound,

  RotateCw,

  Clock,

  ArrowRight,

} from "lucide-react";

import React, { useState, useEffect, Suspense } from "react";

import { useRouter, useSearchParams } from "next/navigation";



type AuthMode = "signin" | "register" | "verify_otp" | "forgot_password" | "reset_password";



function LoginFormContent() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const redirectTarget = searchParams?.get("redirect");

  const modeParam = searchParams?.get("mode");

  const emailParam = searchParams?.get("email");

  const errorParam = searchParams?.get("error");



  const { theme } = useTheme();
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => { setIsDemo(isDemoMode()); }, []);

  const isDark = theme === "dark";



  const {

    user,

    logout,

    loginWithGoogle,

    loginWithCredentials,

    register,

    verifyOtp,

    resendOtp,

    forgotPassword,

    resetPassword,

    isAuthenticated,

    isLoading: authChecking,

  } = useAuth();



  // Navigation mode

  const [mode, setMode] = useState<AuthMode>("signin");



  // Form Fields

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [otpCode, setOtpCode] = useState("");

  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [acceptTerms, setAcceptTerms] = useState(true);



  // Password Visibility

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);



  // UI & Loading States

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [maskedEmail, setMaskedEmail] = useState<string>("");

  const [resendCooldown, setResendCooldown] = useState<number>(0);



  // Initialize from searchParams

  useEffect(() => {

    if (modeParam === "register") setMode("register");

    else if (modeParam === "verify") setMode("verify_otp");

    else if (modeParam === "forgot") setMode("forgot_password");

    else if (modeParam === "reset") setMode("reset_password");

    if (emailParam) setEmail(emailParam);

    if (errorParam) setErrorMessage(decodeURIComponent(errorParam));

  }, [modeParam, emailParam, errorParam]);



  // Resend Cooldown Timer

  useEffect(() => {

    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {

      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));

    }, 1000);

    return () => clearInterval(timer);

  }, [resendCooldown]);



  // Only auto-redirect if an explicit redirect param is requested (e.g. from a protected route)

  useEffect(() => {

    if (isAuthenticated && !authChecking && !isSubmitting) {

      const dest =

        redirectTarget && redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")

          ? redirectTarget

          : "/dashboard";

      router.push(dest);

    }

  }, [isAuthenticated, authChecking, isSubmitting, redirectTarget, router]);



  const clearMessages = () => {

    setErrorMessage(null);

    setSuccessMessage(null);

  };



  // Helper for safe relative redirect

  const completeAuthSuccess = () => {

    const target =

      redirectTarget && redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")

        ? redirectTarget

        : "/dashboard";

    setTimeout(() => {

      router.push(target);

    }, 250);

  };



  // 1. SIGN IN SUBMIT

  const handleSignInSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    clearMessages();



    if (!email.trim() || !password) {

      setErrorMessage("Please enter both your email address and password.");

      return;

    }



    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {

      setErrorMessage("Please enter a valid email address.");

      return;

    }



    setIsSubmitting(true);

    try {

      const result = await loginWithCredentials({ email: email.trim(), password });

      if (result.success && result.user) {

        setSuccessMessage("Authenticated successfully! Redirecting...");

        completeAuthSuccess();

      } else if (result.requiresVerification) {

        setMaskedEmail(result.email || email);

        setMode("verify_otp");

        setSuccessMessage(

          result.message || "Email verification required. We've sent a 6-digit code."

        );

        if (result.retryAfterSeconds) setResendCooldown(result.retryAfterSeconds);

      } else {

        setErrorMessage(result.error || "Incorrect email or password.");

      }

    } catch (err: any) {

      const msg = err?.message || "";

      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || err?.name === "TypeError") {

        setErrorMessage("Unable to connect to the server. Please try again.");

      } else {

        setErrorMessage(msg || "Unable to connect to the server. Please try again.");

      }

    } finally {

      setIsSubmitting(false);

    }

  };



  // 2. CREATE ACCOUNT SUBMIT

  const handleRegisterSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    clearMessages();



    if (!name.trim()) {

      setErrorMessage("Please enter your full name.");

      return;

    }



    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {

      setErrorMessage("Please enter a valid email address.");

      return;

    }



    if (password.length < 8) {

      setErrorMessage("Password must be at least 8 characters long.");

      return;

    }



    if (password !== confirmPassword) {

      setErrorMessage("Passwords do not match. Please re-enter your password.");

      return;

    }



    if (!acceptTerms) {

      setErrorMessage("Please accept the Terms of Service and Privacy Policy to continue.");

      return;

    }



    setIsSubmitting(true);

    try {

      const result = await register({

        name: name.trim(),

        email: email.trim(),

        password,

      });



      if (result.success) {

        if (result.requiresVerification) {

          setMaskedEmail(result.email || email.trim());

          setMode("verify_otp");

          setSuccessMessage(

            result.message || "Account created! A 6-digit verification code has been sent."

          );

          setResendCooldown(result.retryAfterSeconds || 60);

        } else if (result.user) {

          setSuccessMessage("Account created successfully! Redirecting to dashboard...");

          completeAuthSuccess();

        } else {

          setSuccessMessage(result.message || "Account created successfully! Please sign in with your credentials.");

          setMode("signin");

        }

      } else {

        setErrorMessage(result.error || "Unable to create account. Please try again.");

      }

    } catch (err: any) {

      const msg = err?.message || "";

      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || err?.name === "TypeError") {

        setErrorMessage("Unable to connect to the server. Please try again.");

      } else {

        setErrorMessage(msg || "Unable to connect to the server. Please try again.");

      }

    } finally {

      setIsSubmitting(false);

    }

  };



  // 3. VERIFY OTP SUBMIT

  const handleVerifyOtpSubmit = async (e?: React.FormEvent) => {

    if (e) e.preventDefault();

    clearMessages();



    if (otpCode.length !== 6) {

      setErrorMessage("Please enter the complete 6-digit verification code.");

      return;

    }



    setIsSubmitting(true);

    try {

      const result = await verifyOtp({

        email: email.trim(),

        otp: otpCode.trim(),

      });



      if (result.success && result.user) {

        setSuccessMessage("Email verified! Redirecting to dashboard...");

        completeAuthSuccess();

      } else {

        setErrorMessage(result.error || "Invalid verification code.");

      }

    } catch (err: any) {

      setErrorMessage(err?.message || "Failed to verify code.");

    } finally {

      setIsSubmitting(false);

    }

  };



  // 4. RESEND OTP

  const handleResendOtp = async () => {

    if (resendCooldown > 0 || isSubmitting) return;

    clearMessages();



    setIsSubmitting(true);

    try {

      const result = await resendOtp({ email: email.trim() });

      if (result.success) {

        setSuccessMessage(result.message || "A new 6-digit code has been sent.");

        setResendCooldown(result.retryAfterSeconds || 60);

      } else {

        setErrorMessage(result.error || "Unable to resend code.");

        if (result.retryAfterSeconds) setResendCooldown(result.retryAfterSeconds);

      }

    } catch (err: any) {

      setErrorMessage(err?.message || "Failed to resend code.");

    } finally {

      setIsSubmitting(false);

    }

  };



  // 5. FORGOT PASSWORD SUBMIT

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    clearMessages();



    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {

      setErrorMessage("Please enter a valid email address.");

      return;

    }



    setIsSubmitting(true);

    try {

      const result = await forgotPassword({ email: email.trim() });

      setSuccessMessage(

        result.message ||

          "If an account with that email exists, reset instructions have been sent."

      );

    } catch (err: any) {

      setErrorMessage(err?.message || "Failed to submit password reset request.");

    } finally {

      setIsSubmitting(false);

    }

  };



  // 6. RESET PASSWORD SUBMIT

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    clearMessages();



    if (!resetToken.trim()) {

      setErrorMessage("Please enter the recovery code sent to your email.");

      return;

    }



    if (newPassword.length < 8) {

      setErrorMessage("Password must be at least 8 characters long.");

      return;

    }



    if (newPassword !== confirmNewPassword) {

      setErrorMessage("Passwords do not match.");

      return;

    }



    setIsSubmitting(true);

    try {

      const result = await resetPassword({

        email: email.trim(),

        token: resetToken.trim(),

        newPassword,

      });



      if (result.success) {

        setSuccessMessage(

          result.message || "Password successfully reset! Please sign in with your new password."

        );

        setPassword("");

        setMode("signin");

      } else {

        setErrorMessage(result.error || "Failed to reset password.");

      }

    } catch (err: any) {

      setErrorMessage(err?.message || "Failed to reset password.");

    } finally {

      setIsSubmitting(false);

    }

  };



  // Google OAuth Handlers

  const handleGoogleCredential = async (credential: string) => {

    setIsSubmitting(true);

    clearMessages();



    try {

      const result = await loginWithGoogle(credential);

      if (result.success && result.user) {

        setSuccessMessage("Authenticated with Google! Redirecting...");

        completeAuthSuccess();

      } else {

        setErrorMessage(

          result.error || "Google authentication was rejected by CodeAtlas backend."

        );

        setIsSubmitting(false);

      }

    } catch (err: any) {

      setErrorMessage(err?.message || "Network error connecting to CodeAtlas authentication service.");

      setIsSubmitting(false);

    }

  };



  const handleGoogleError = (err: string) => {

    setErrorMessage(err);

    setIsSubmitting(false);

  };



  if (isAuthenticated && !authChecking && !isSubmitting) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)]">

        <div className="flex flex-col items-center gap-3">

          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />

          <p className="text-xs font-mono font-medium text-[var(--text-secondary)]">Redirecting to dashboard...</p>

        </div>

      </div>

    );

  }



  return (

    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors">

      {/* Left Form Panel */}

      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-16 max-w-xl mx-auto w-full">

        {/* Top Header */}

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



        {/* Center Content */}

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

                <Link

                  href="/dashboard"

                  className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)] transition-all shadow-sm"

                >

                  Go to Dashboard

                </Link>

                <button

                  type="button"

                  onClick={async () => {

                    await logout();

                    window.location.reload();

                  }}

                  className="flex-1 sm:flex-none text-center px-3.5 py-2 rounded-xl border border-[var(--border-color)] font-semibold text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"

                >

                  Sign Out to Login Again

                </button>

              </div>

            </div>

          )}



          {/* Heading Section */}

          {mode === "signin" && (

            <>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">

                {isDark ? "Welcome back." : "Hello, mapmaker."}

              </h1>

              <p className="mt-2 text-sm sm:text-base font-medium text-[var(--text-secondary)]">

                Sign in to continue exploring your code city.

              </p>

            </>

          )}



          {mode === "register" && (

            <>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">

                Create your account

              </h1>

              <p className="mt-2 text-sm sm:text-base font-medium text-[var(--text-secondary)]">

                Start mapping your architectures and codebase intelligence.

              </p>

            </>

          )}



          {mode === "verify_otp" && (

            <>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">

                Verify your email

              </h1>

              <p className="mt-2 text-sm sm:text-base font-medium text-[var(--text-secondary)]">

                We&apos;ve sent a 6-digit confirmation code to{" "}

                <strong className="text-[var(--text-primary)] font-mono">

                  {maskedEmail || email || "your inbox"}

                </strong>

                .

              </p>

            </>

          )}



          {mode === "forgot_password" && (

            <>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">

                Reset your password

              </h1>

              <p className="mt-2 text-sm sm:text-base font-medium text-[var(--text-secondary)]">

                Enter your email address and we&apos;ll send you recovery instructions.

              </p>

            </>

          )}



          {mode === "reset_password" && (

            <>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">

                Set new password

              </h1>

              <p className="mt-2 text-sm sm:text-base font-medium text-[var(--text-secondary)]">

                Enter your recovery code and choose a new secure password.

              </p>

            </>

          )}



          {/* Navigation Segmented Control: Sign In vs Create Account */}

          {(mode === "signin" || mode === "register") && (

            <div

              role="tablist"

              aria-label="Authentication modes"

              className="mt-6 p-1 rounded-2xl bg-[var(--border-color)]/30 border border-[var(--border-color)] flex items-center gap-1"

            >

              <button

                type="button"

                role="tab"

                id="tab-signin"

                aria-selected={mode === "signin"}

                aria-controls="panel-signin"

                onClick={() => {

                  setMode("signin");

                  clearMessages();

                }}

                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${

                  mode === "signin"

                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]/60"

                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"

                }`}

              >

                Sign In

              </button>

              <button

                type="button"

                role="tab"

                id="tab-register"

                aria-selected={mode === "register"}

                aria-controls="panel-register"

                onClick={() => {

                  setMode("register");

                  clearMessages();

                }}

                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${

                  mode === "register"

                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]/60"

                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"

                }`}

              >

                Create Account

              </button>

            </div>

          )}



          {/* Error Message Banner */}

          {errorMessage && (

            <div

              role="alert"

              aria-live="assertive"

              className="mt-5 p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs text-red-500 flex items-start gap-3 animate-in fade-in"

            >

              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />

              <div className="flex-1 text-left">

                <p className="font-bold">Authentication Notice</p>

                <p className="mt-0.5 opacity-90 leading-relaxed">{errorMessage}</p>

                {errorMessage.includes("GitHub OAuth is not configured") && (

                  <div className="mt-3 pt-2 border-t border-red-500/20 flex flex-wrap items-center gap-2">

                    <a

                      href="/api/auth/github?mode=login&sandbox=true"

                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 shadow-sm transition-opacity"

                    >

                      <Sparkles className="w-3.5 h-3.5" />

                      Sign In with Sandbox GitHub Demo

                    </a>

                  </div>

                )}

              </div>

              <button

                type="button"

                onClick={() => setErrorMessage(null)}

                className="text-red-400 hover:text-red-300 transition-colors"

                aria-label="Dismiss error message"

              >

                <XCircle className="w-4 h-4" />

              </button>

            </div>

          )}



          {/* Success Message Banner */}

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

                aria-label="Dismiss message"

              >

                <XCircle className="w-4 h-4" />

              </button>

            </div>

          )}



          {/* VIEW 1: SIGN IN */}

          {mode === "signin" && (

            <div id="panel-signin" role="tabpanel" aria-labelledby="tab-signin" className="mt-6">
              {/* Live Demo Banner for Static GitHub Pages */}
              {isDemo && (
                <div className="mb-6 p-4 rounded-2xl border border-[var(--primary)]/40 bg-[var(--primary)]/10 text-center animate-in fade-in">
                  <div className="flex items-center justify-center gap-2 mb-1.5 text-sm font-bold text-[var(--primary)]">
                    <Sparkles className="w-4 h-4" />
                    <span>Interactive Live Demo</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-3">
                    Explore all 15+ CodeAtlas intelligence modules with pre-indexed sample repositories. Zero configuration required.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        try { localStorage.removeItem("codeatlas_demo_active_user"); } catch {}
                      }
                      router.push("/dashboard");
                    }}
                    className="w-full h-11 rounded-full bg-[var(--primary)] text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Explore the live demo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 1. Continue with Google & 2. Continue with GitHub */}

              <div className="flex flex-col items-center gap-3">

                <GoogleSignInButton

                  onCredential={handleGoogleCredential}

                  onError={handleGoogleError}

                  disabled={isSubmitting || isDemo}

                  isLoading={isSubmitting}

                />

                <GitHubSignInButton

                  disabled={isSubmitting || isDemo}

                  isLoading={isSubmitting}

                  redirectTarget={redirectTarget || undefined}

                />

                {isDemo && (
                  <p className="text-[11px] font-mono text-[var(--text-secondary)] text-center">
                    Available in the full deployment
                  </p>
                )}

              </div>



              {/* 4. OR divider */}

              <div className="relative my-6">

                <div className="absolute inset-0 flex items-center">

                  <div className="w-full border-t border-[var(--border-color)]" />

                </div>

                <div className="relative flex justify-center text-[10px] uppercase font-mono font-bold">

                  <span className="bg-[var(--bg-page)] px-3 text-[var(--text-secondary)]">

                    or continue with

                  </span>

                </div>

              </div>



              {/* 5. Existing email login form */}

              <form onSubmit={handleSignInSubmit} className="space-y-4">

                {/* Email Address */}

                <div>

                  <label

                    htmlFor="signin-email"

                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"

                  >

                    Email Address

                  </label>

                  <div className="relative">

                    <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input

                      id="signin-email"

                      type="email"

                      required

                      autoComplete="email"

                      placeholder="alex@codeatlas.dev"

                      value={email}

                      onChange={(e) => setEmail(e.target.value)}

                      disabled={isSubmitting || isDemo}

                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"

                    />

                  </div>

                </div>



                {/* Password */}

                <div>

                  <div className="flex items-center justify-between mb-1.5">

                    <label

                      htmlFor="signin-password"

                      className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"

                    >

                      Password

                    </label>

                    <button

                      type="button"

                      onClick={() => {

                        clearMessages();

                        setMode("forgot_password");

                      }}

                      className="text-xs font-semibold text-[var(--primary)] hover:underline"

                    >

                      Forgot password?

                    </button>

                  </div>

                  <div className="relative">

                    <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input

                      id="signin-password"

                      type={showPassword ? "text" : "password"}

                      required

                      autoComplete="current-password"

                      placeholder="••••••••••••"

                      value={password}

                      onChange={(e) => setPassword(e.target.value)}

                      disabled={isSubmitting || isDemo}

                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"

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



                {/* 6. Existing Continue Button */}

                <button

                  type="submit"

                  disabled={isSubmitting || isDemo}

                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"

                >

                  {isSubmitting ? (

                    <>

                      <RotateCw className="w-4 h-4 animate-spin" />

                      <span>Signing in...</span>

                    </>

                  ) : (

                    <span>Continue</span>

                  )}

                </button>

              </form>



              {/* 7. Create your account link */}

              <p className="mt-5 text-center text-xs text-[var(--text-secondary)]">

                Don&apos;t have an account?{" "}

                <button

                  type="button"

                  onClick={() => {

                    clearMessages();

                    setMode("register");

                  }}

                  className="font-bold text-[var(--primary)] hover:underline"

                >

                  Create your account

                </button>

              </p>

            </div>

          )}



          {/* VIEW 2: CREATE ACCOUNT */}

          {mode === "register" && (

            <div id="panel-register" role="tabpanel" aria-labelledby="tab-register" className="mt-6">

              {/* Social Registration */}

              <div className="flex flex-col items-center gap-3">

                <GoogleSignInButton

                  onCredential={handleGoogleCredential}

                  onError={handleGoogleError}

                  disabled={isSubmitting || isDemo}

                  isLoading={isSubmitting}

                />

                <GitHubSignInButton

                  disabled={isSubmitting || isDemo}

                  isLoading={isSubmitting}

                  redirectTarget={redirectTarget || undefined}

                />

              </div>



              {/* Divider */}

              <div className="relative my-6">

                <div className="absolute inset-0 flex items-center">

                  <div className="w-full border-t border-[var(--border-color)]" />

                </div>

                <div className="relative flex justify-center text-[10px] uppercase font-mono font-bold">

                  <span className="bg-[var(--bg-page)] px-3 text-[var(--text-secondary)]">

                    or register with email

                  </span>

                </div>

              </div>



              <form onSubmit={handleRegisterSubmit} className="space-y-4">

                {/* Full Name */}

                <div>

                  <label

                    htmlFor="register-name"

                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"

                  >

                    Full Name

                  </label>

                  <div className="relative">

                    <User className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input

                      id="register-name"

                      type="text"

                      required

                      autoComplete="name"

                      placeholder="Alex Mercer"

                      value={name}

                      onChange={(e) => setName(e.target.value)}

                      disabled={isSubmitting || isDemo}

                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"

                    />

                  </div>

                </div>



                {/* Email Address */}

                <div>

                  <label

                    htmlFor="register-email"

                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"

                  >

                    Email Address

                  </label>

                  <div className="relative">

                    <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input

                      id="register-email"

                      type="email"

                      required

                      autoComplete="email"

                      placeholder="alex@codeatlas.dev"

                      value={email}

                      onChange={(e) => setEmail(e.target.value)}

                      disabled={isSubmitting || isDemo}

                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"

                    />

                  </div>

                </div>



                {/* Password */}

                <div>

                  <label

                    htmlFor="register-password"

                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"

                  >

                    Password

                  </label>

                  <div className="relative">

                    <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input

                      id="register-password"

                      type={showPassword ? "text" : "password"}

                      required

                      autoComplete="new-password"

                      placeholder="At least 8 characters"

                      value={password}

                      onChange={(e) => setPassword(e.target.value)}

                      disabled={isSubmitting || isDemo}

                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"

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



                {/* Confirm Password */}

                <div>

                  <label

                    htmlFor="register-confirm-password"

                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"

                  >

                    Confirm Password

                  </label>

                  <div className="relative">

                    <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input

                      id="register-confirm-password"

                      type={showConfirmPassword ? "text" : "password"}

                      required

                      autoComplete="new-password"

                      placeholder="Repeat your password"

                      value={confirmPassword}

                      onChange={(e) => setConfirmPassword(e.target.value)}

                      disabled={isSubmitting || isDemo}

                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"

                    />

                    <button

                      type="button"

                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}

                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}

                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"

                    >

                      {showConfirmPassword ? (

                        <EyeOff className="w-4 h-4" />

                      ) : (

                        <Eye className="w-4 h-4" />

                      )}

                    </button>

                  </div>

                </div>



                {/* Terms checkbox */}

                <div className="flex items-start gap-2 pt-1">

                  <input

                    id="terms-checkbox"

                    type="checkbox"

                    checked={acceptTerms}

                    onChange={(e) => setAcceptTerms(e.target.checked)}

                    className="mt-0.5 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"

                  />

                  <label htmlFor="terms-checkbox" className="text-xs text-[var(--text-secondary)]">

                    I agree to the{" "}

                    <Link href="/terms" className="underline hover:text-[var(--text-primary)]">

                      Terms

                    </Link>{" "}

                    and acknowledge the{" "}

                    <Link href="/privacy" className="underline hover:text-[var(--text-primary)]">

                      Privacy Policy

                    </Link>

                    .

                  </label>

                </div>



                {/* Submit Register Button */}

                <button

                  type="submit"

                  disabled={isSubmitting || isDemo}

                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"

                >

                  {isSubmitting ? (

                    <>

                      <RotateCw className="w-4 h-4 animate-spin" />

                      <span>Creating Account...</span>

                    </>

                  ) : (

                    <span>Create Account</span>

                  )}

                </button>

              </form>



              {/* Link back to Sign In */}

              <p className="mt-5 text-center text-xs text-[var(--text-secondary)]">

                Already have an account?{" "}

                <button

                  type="button"

                  onClick={() => {

                    clearMessages();

                    setMode("signin");

                  }}

                  className="font-bold text-[var(--primary)] hover:underline"

                >

                  Sign in

                </button>

              </p>

            </div>

          )}



          {/* VIEW 3: VERIFY OTP */}

          {mode === "verify_otp" && (

            <div className="mt-6">

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">

                <div className="text-center">

                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">

                    Enter 6-Digit Code

                  </label>

                  <OtpInput

                    value={otpCode}

                    onChange={setOtpCode}

                    onComplete={() => {}}

                    disabled={isSubmitting || isDemo}

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

                      <span>Verifying Code...</span>

                    </>

                  ) : (

                    <span>Verify Email</span>

                  )}

                </button>

              </form>



              {/* Resend Code Section */}

              <div className="mt-6 pt-4 border-t border-[var(--border-color)] text-center space-y-2">

                <p className="text-xs text-[var(--text-secondary)]">

                  Didn&apos;t receive the code? Check spam or resend.

                </p>

                <button

                  type="button"

                  disabled={resendCooldown > 0 || isSubmitting}

                  onClick={handleResendOtp}

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



              {/* Return to Sign In */}

              <div className="mt-4 text-center">

                <button

                  type="button"

                  onClick={() => {

                    clearMessages();

                    setMode("signin");

                  }}

                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"

                >

                  Wrong email? Return to sign in

                </button>

              </div>

            </div>

          )}



          {/* VIEW 4: FORGOT PASSWORD */}

          {mode === "forgot_password" && (

            <div className="mt-6">

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">

                <div>

                  <label

                    htmlFor="forgot-email"

                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"

                  >

                    Account Email

                  </label>

                  <div className="relative">

                    <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input

                      id="forgot-email"

                      type="email"

                      required

                      autoComplete="email"

                      placeholder="alex@codeatlas.dev"

                      value={email}

                      onChange={(e) => setEmail(e.target.value)}

                      disabled={isSubmitting || isDemo}

                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"

                    />

                  </div>

                </div>



                <button

                  type="submit"

                  disabled={isSubmitting || isDemo}

                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold shadow-md hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"

                >

                  {isSubmitting ? (

                    <>

                      <RotateCw className="w-4 h-4 animate-spin" />

                      <span>Sending Instructions...</span>

                    </>

                  ) : (

                    <span>Send Reset Instructions</span>

                  )}

                </button>

              </form>



              {/* Action buttons */}

              <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs">

                <button

                  type="button"

                  onClick={() => {

                    clearMessages();

                    setMode("signin");

                  }}

                  className="font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"

                >

                  ← Return to sign in

                </button>



                <button

                  type="button"

                  onClick={() => {

                    clearMessages();

                    setMode("reset_password");

                  }}

                  className="font-bold text-[var(--primary)] hover:underline flex items-center gap-1"

                >

                  Have a code? Reset here <ArrowRight className="w-3.5 h-3.5" />

                </button>

              </div>

            </div>

          )}



          {/* VIEW 5: RESET PASSWORD */}

          {mode === "reset_password" && (

            <div className="mt-6">

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">

                {/* Email Address */}

                <div>

                  <label

                    htmlFor="reset-email"

                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"

                  >

                    Email Address

                  </label>

                  <div className="relative">

                    <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input

                      id="reset-email"

                      type="email"

                      required

                      autoComplete="email"

                      placeholder="alex@codeatlas.dev"

                      value={email}

                      onChange={(e) => setEmail(e.target.value)}

                      disabled={isSubmitting || isDemo}

                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"

                    />

                  </div>

                </div>



                {/* Recovery Code */}

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

                      placeholder="123456"

                      value={resetToken}

                      onChange={(e) => setResetToken(e.target.value.replace(/\D/g, "").slice(0, 6))}

                      disabled={isSubmitting || isDemo}

                      className="w-full pl-10 pr-4 py-2.5 font-mono text-center tracking-widest text-base font-bold rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"

                    />

                  </div>

                </div>



                {/* New Password */}

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

                      type={showNewPassword ? "text" : "password"}

                      required

                      autoComplete="new-password"

                      placeholder="At least 8 characters"

                      value={newPassword}

                      onChange={(e) => setNewPassword(e.target.value)}

                      disabled={isSubmitting || isDemo}

                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"

                    />

                    <button

                      type="button"

                      onClick={() => setShowNewPassword(!showNewPassword)}

                      aria-label={showNewPassword ? "Hide password" : "Show password"}

                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"

                    >

                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}

                    </button>

                  </div>

                </div>



                {/* Confirm New Password */}

                <div>

                  <label

                    htmlFor="reset-confirm-new-password"

                    className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5"

                  >

                    Confirm New Password

                  </label>

                  <div className="relative">

                    <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />

                    <input

                      id="reset-confirm-new-password"

                      type={showNewPassword ? "text" : "password"}

                      required

                      autoComplete="new-password"

                      placeholder="Repeat new password"

                      value={confirmNewPassword}

                      onChange={(e) => setConfirmNewPassword(e.target.value)}

                      disabled={isSubmitting || isDemo}

                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"

                    />

                  </div>

                </div>



                <button

                  type="submit"

                  disabled={isSubmitting || isDemo}

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



              <div className="mt-6 text-center">

                <button

                  type="button"

                  onClick={() => {

                    clearMessages();

                    setMode("signin");

                  }}

                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"

                >

                  ← Return to sign in

                </button>

              </div>

            </div>

          )}



          {/* Privacy & GitHub Notice */}

          <div className="mt-8 space-y-3">

            <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed">

              GitHub is connected separately after sign-in. By continuing you accept the{" "}

              <Link href="/terms" className="underline hover:text-[var(--text-primary)]">

                Terms

              </Link>{" "}

              and{" "}

              <Link href="/privacy" className="underline hover:text-[var(--text-primary)]">

                Privacy policy

              </Link>.

            </p>



            <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-[var(--text-secondary)]">

              <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />

              <span>Zero training on private repositories</span>

            </div>

          </div>

        </div>



        {/* Footer info */}

        <div className="text-xs font-medium text-[var(--text-secondary)] pt-4">

          &copy; {new Date().getFullYear()} CodeAtlas Platform Inc.

        </div>

      </div>



      {/* Right Decorative Showcase Panel */}

      <div

        className={`hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden transition-colors ${

          isDark

            ? "bg-[#070A12] border-l border-[#242B39]"

            : "bg-gradient-to-br from-[#6C4DFF] to-[#4B31D6] text-white"

        }`}

      >

        {isDark ? (

          // Dark Theme Showcase

          <div className="w-full max-w-md space-y-6">

            <div className="relative">

              {/* Subtle ambient cyan glow */}

              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#29D3C2]/20 to-[#8B7CFF]/20 blur-xl opacity-70" />



              <div className="relative rounded-2xl bg-[#0D111B] border border-[#242B39] p-6 shadow-2xl">

                <div className="flex items-center justify-between pb-4 border-b border-[#242B39]/80">

                  <div className="flex items-center gap-2">

                    <span className="w-3 h-3 rounded-full bg-[#FF5A5F]/80" />

                    <span className="w-3 h-3 rounded-full bg-[#FFC53D]/80" />

                    <span className="w-3 h-3 rounded-full bg-[#2FD6A0]/80" />

                    <span className="ml-2 font-mono text-xs text-[#9AA4B5]">auth.py</span>

                  </div>

                  <span className="font-mono text-[10px] text-[#29D3C2] bg-[#29D3C2]/10 px-2 py-0.5 rounded">

                    Python

                  </span>

                </div>



                <div className="pt-4 font-mono text-sm leading-7">

                  <div className="text-[#9AA4B5]">

                    <span className="inline-block w-8 text-right pr-4 text-[#9AA4B5]/50">12</span>

                    <span className="text-[#8B7CFF]">def</span> <span className="text-[#29D3C2]">login</span>(email, pw):

                  </div>

                  <div className="text-[#9AA4B5]">

                    <span className="inline-block w-8 text-right pr-4 text-[#9AA4B5]/50">13</span>

                    {"    "}user = db.<span className="text-[#F3C969]">find</span>(email)

                  </div>

                  <div className="text-[#9AA4B5]">

                    <span className="inline-block w-8 text-right pr-4 text-[#9AA4B5]/50">14</span>

                    {"    "}<span className="text-[#8B7CFF]">return</span> <span className="text-[#29D3C2]">verify</span>(user, pw)

                  </div>

                </div>



                <div className="mt-4 pt-3 border-t border-[#242B39]/60 flex items-center gap-2 text-xs font-mono text-[#29D3C2]">

                  <span>↳</span>

                  <span className="text-[#9AA4B5]">used in 3 files · 2 tests</span>

                </div>

              </div>

            </div>



            <div className="rounded-xl bg-[#0D111B]/80 border border-[#242B39] p-4 text-xs font-mono text-[#9AA4B5]">

              <div className="flex items-center gap-2 text-[#29D3C2] font-semibold mb-1">

                <Sparkles className="w-3.5 h-3.5" />

                <span>AI Receipt Confirmed</span>

              </div>

              Trace links verified in <code className="text-[#F3F5FA]">POST /auth</code> & <code className="text-[#F3F5FA]">test_auth.py:7</code>

            </div>

          </div>

        ) : (

          // Light Theme Showcase

          <div className="w-full max-w-lg text-center space-y-6">

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">

              <City className="w-full" forceMode="light" />

            </div>

            <div className="text-white/90">

              <h3 className="text-xl font-bold">Your repository, mapped in real time.</h3>

              <p className="mt-1 text-sm text-white/70">

                Walk through codebase architecture like walking through a city.

              </p>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}



export default function Login() {

  return (

    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-page)]" />}>

      <LoginFormContent />

    </Suspense>

  );

}
