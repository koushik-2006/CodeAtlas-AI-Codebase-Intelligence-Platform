"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const sizeClasses = {
      sm: "px-3.5 py-1.5 text-xs rounded-xl",
      md: "px-5 py-2.5 text-sm rounded-full",
      lg: "px-7 py-3.5 text-base rounded-full",
    };

    const getVariantClasses = () => {
      switch (variant) {
        case "primary":
          return isDark
            ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8] shadow-[0_0_20px_-5px_rgba(41,211,194,0.35)]"
            : "bg-[#19143D] text-white hover:bg-[#2b2361] shadow-soft";
        case "accent":
          return isDark
            ? "bg-[#8B7CFF] text-[#070A12] hover:bg-[#7a6aef]"
            : "bg-[#6C4DFF] text-white hover:bg-[#5838e6] shadow-soft";
        case "outline":
          return isDark
            ? "border border-[#242B39] text-[#F3F5FA] bg-[#0D111B] hover:border-[#29D3C2]/50 hover:bg-[#111725]"
            : "border border-[#E8E5F4] text-[#19143D] bg-white hover:bg-[#FAF9FF] hover:border-[#6C4DFF]/40 shadow-sm";
        case "ghost":
          return "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/20";
        case "danger":
          return "border border-red-500/30 text-red-500 hover:bg-red-500/10";
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${sizeClasses[size]} ${getVariantClasses()} ${className}`}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

