"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "cyan" | "sun" | "mint" | "coral" | "gray";
}

export function Badge({ children, variant = "brand", className = "", ...props }: BadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getVariantStyles = () => {
    switch (variant) {
      case "cyan":
        return isDark
          ? "bg-[#29D3C2]/15 text-[#29D3C2] border border-[#29D3C2]/30"
          : "bg-[#D7F7EA] text-[#1BA97B] border border-[#2FD6A0]/30";
      case "brand":
        return isDark
          ? "bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30"
          : "bg-[#EAE5FF] text-[#6C4DFF] border border-[#6C4DFF]/20";
      case "sun":
        return isDark
          ? "bg-[#F3C969]/15 text-[#F3C969] border border-[#F3C969]/30"
          : "bg-[#FFF0BF] text-[#B38300] border border-[#FFC53D]/40";
      case "mint":
        return "bg-[#2FD6A0]/15 text-[#2FD6A0] border border-[#2FD6A0]/30";
      case "coral":
        return "bg-red-500/15 text-red-500 border border-red-500/30";
      case "gray":
        return "bg-[var(--border-color)]/50 text-[var(--text-secondary)]";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold ${getVariantStyles()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
