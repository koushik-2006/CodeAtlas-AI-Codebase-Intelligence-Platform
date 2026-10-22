"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={`inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 border ${
        theme === "light"
          ? "bg-white border-[#E8E5F4] text-[#19143D] hover:bg-[#FAF9FF] shadow-sm"
          : "bg-[#0D111B] border-[#242B39] text-[#29D3C2] hover:bg-[#111725] hover:border-[#29D3C2]/40"
      } ${className}`}
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4 text-[#6C4DFF]" />
      ) : (
        <Sun className="w-4 h-4 text-[#F3C969]" />
      )}
    </button>
  );
}
