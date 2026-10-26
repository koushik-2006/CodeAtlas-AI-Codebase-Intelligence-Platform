"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";

export function LoadingState({ message = "Loading codebase intelligence..." }: { message?: string }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div
        className={`h-8 w-8 rounded-full border-2 border-t-transparent animate-spin ${
          isDark ? "border-[#29D3C2]" : "border-[#6C4DFF]"
        }`}
      />
      <p className="mt-4 font-mono text-xs text-[var(--text-secondary)] font-medium">
        {message}
      </p>
    </div>
  );
}
