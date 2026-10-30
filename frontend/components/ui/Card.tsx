"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ children, elevated = false, className = "", ...props }: CardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 ${
        isDark
          ? elevated
            ? "bg-[#111725] border-[#242B39]"
            : "bg-[#0D111B] border-[#242B39]"
          : elevated
          ? "bg-white border-[#E8E5F4] shadow-md"
          : "bg-white border-[#E8E5F4] shadow-soft"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
