"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import City from "@/components/City";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = () => {
    setIsSigningIn(true);
    // Realistic prototype login transition
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors">
      {/* Left Form Panel */}
      <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-20 max-w-xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="CodeAtlas Home">
            <Logo size="md" />
          </Link>
          <ThemeToggle />
        </div>

        {/* Center Content */}
        <div className="my-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            {isDark ? "Welcome back." : "Hello, mapmaker."}
          </h1>
          <p className="mt-3 text-base sm:text-lg font-medium text-[var(--text-secondary)]">
            {isDark
              ? "Sign in to continue exploring your codebases."
              : "Sign in to build and explore your code city."}
          </p>

          {/* Google Sign-In Action */}
          <div className="mt-8">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className={`w-full flex items-center justify-center gap-3.5 py-4 px-6 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 border shadow-sm active:scale-[0.99] ${
                isDark
                  ? "bg-[#0D111B] border-[#242B39] text-[#F3F5FA] hover:bg-[#111725] hover:border-[#29D3C2]/50 hover:shadow-[0_0_20px_-5px_rgba(41,211,194,0.3)]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] hover:bg-[#FAF9FF] shadow-soft"
              }`}
            >
              {isSigningIn ? (
                <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                </svg>
              )}
              {isSigningIn ? "Connecting to Workspace..." : "Continue with Google"}
            </button>
          </div>

          {/* Privacy & GitHub Notice */}
          <div className="mt-6 space-y-3">
            <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
              GitHub is connected separately after sign-in. By continuing you accept the{" "}
              <Link href="/terms" className="underline hover:text-[var(--text-primary)]">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-[var(--text-primary)]">Privacy policy</Link>.
            </p>

            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-[var(--text-secondary)]">
              <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
              <span>Zero training on private repositories</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs font-medium text-[var(--text-secondary)]">
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
          // Dark Theme Showcase (Code Card with cyan accents matching PDF 2 Page 2)
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

                {/* Code Snippet matching PDF 2 */}
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
          // Light Theme Showcase (City illustration on purple background matching PDF 1 Page 2)
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
