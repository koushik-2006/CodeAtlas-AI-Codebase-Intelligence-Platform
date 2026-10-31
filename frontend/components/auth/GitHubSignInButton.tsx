"use client";

import { isDemoMode } from "@/lib/demo/mock-api";
import { isFirebaseConfigured } from "@/lib/firebase";
import React, { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Github } from "@/components/Icons";
import { RotateCw } from "lucide-react";

interface GitHubSignInButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  redirectTarget?: string;
}

export function GitHubSignInButton({
  onClick,
  disabled = false,
  isLoading = false,
  className = "",
  redirectTarget,
}: GitHubSignInButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [internalLoading, setInternalLoading] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (disabled || isLoading || internalLoading) return;

    if (onClick) {
      onClick();
      return;
    }

    if (isDemoMode() && !isFirebaseConfigured) {
      return;
    }

    setInternalLoading(true);
    const redirectParam = redirectTarget
      ? `&redirect=${encodeURIComponent(redirectTarget)}`
      : "";
    window.location.href = `/api/auth/github?mode=login${redirectParam}`;
  };

  const showLoading = isLoading || internalLoading;

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || showLoading}
        aria-label="Continue with GitHub"
        className={`w-full max-w-[360px] h-[44px] rounded-full border px-4 flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-150 select-none shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed ${
          isDark
            ? "bg-[#161B22] border-[#30363D] hover:bg-[#21262D] hover:border-[#8B949E] text-[#F0F6FC] shadow-black/20"
            : "bg-white border-[#D0D7DE] hover:bg-[#F6F8FA] hover:border-[#8C959F] text-[#24292F] shadow-sm"
        }`}
      >
        {showLoading ? (
          <>
            <RotateCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
            <span>Connecting to GitHub...</span>
          </>
        ) : (
          <>
            <Github className="w-4 h-4 shrink-0" />
            <span>Continue with GitHub</span>
          </>
        )}
      </button>
    </div>
  );
}
