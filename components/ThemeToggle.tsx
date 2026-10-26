"use client";

import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme, isMounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={`relative inline-flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-300 border overflow-hidden active:scale-95 hover:scale-105 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
        theme === "light"
          ? "bg-white border-[#E5E5E0] text-[#1E2022] hover:bg-[#FAF9F5] shadow-xs hover:border-[#6C4DFF]/50"
          : "bg-[#161B22] border-[#30363D] text-[#29D3C2] hover:bg-[#0D1117] hover:border-[#29D3C2]/60 hover:shadow-[0_0_15px_-3px_rgba(41,211,194,0.35)]"
      } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!isMounted ? (
          // Pre-mount fallback matching light theme
          <div key="loading" className="flex items-center justify-center text-[#6C4DFF]">
            <Moon className="w-4 h-4 fill-[#6C4DFF]/20" />
          </div>
        ) : theme === "light" ? (
          <motion.div
            key="moon"
            initial={{ y: -16, opacity: 0, rotate: -60 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 16, opacity: 0, rotate: 60 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="flex items-center justify-center text-[#6C4DFF]"
          >
            <Moon className="w-4 h-4 fill-[#6C4DFF]/15" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: -16, opacity: 0, rotate: -60 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 16, opacity: 0, rotate: 60 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="flex items-center justify-center text-[#29D3C2]"
          >
            <Sun className="w-4 h-4 fill-[#29D3C2]/20" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
