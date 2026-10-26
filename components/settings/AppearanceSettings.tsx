"use client";

import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, CheckCircle2 } from "lucide-react";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className={`app-card p-6 sm:p-8 ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
      }`}
    >
      <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-color)]">
        <Sun className="w-5 h-5 text-[var(--primary)]" />
        <h2 className="text-xl font-bold tracking-tight">Appearance & Theme</h2>
      </div>

      <p className="mt-3 text-xs sm:text-sm text-[var(--text-secondary)]">
        Choose your preferred workspace visual identity. Both references are fully supported across all routes.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Light Theme Card */}
        <button
          onClick={() => setTheme("light")}
          className={`p-5 rounded-2xl border text-left transition-all relative ${
            theme === "light"
              ? "border-[#6C4DFF] bg-[#FAF9FF] ring-2 ring-[#6C4DFF]/30 shadow-md"
              : "border-[#E8E5F4] bg-white hover:border-[#6C4DFF]/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#FFC53D]" />
              <span className="font-bold text-sm text-[#19143D]">
                Reference 1 — Light Theme
              </span>
            </div>
            {theme === "light" && (
              <CheckCircle2 className="w-4 h-4 text-[#6C4DFF]" />
            )}
          </div>
          <p className="mt-2 text-xs text-[#68677D] leading-relaxed">
            Soft lavender background (#FAF9FF), white cards, purple (#6C4DFF) highlights, and 3D isometric city planner aesthetic.
          </p>
          <div className="mt-4 flex gap-1.5">
            <span className="h-4 w-4 rounded-full bg-[#FAF9FF] border border-[#E8E5F4]" />
            <span className="h-4 w-4 rounded-full bg-[#6C4DFF]" />
            <span className="h-4 w-4 rounded-full bg-[#FFC53D]" />
            <span className="h-4 w-4 rounded-full bg-[#2FD6A0]" />
            <span className="h-4 w-4 rounded-full bg-[#FF5A5F]" />
          </div>
        </button>

        {/* Dark Theme Card */}
        <button
          onClick={() => setTheme("dark")}
          className={`p-5 rounded-2xl border text-left transition-all relative ${
            theme === "dark"
              ? "border-[#29D3C2] bg-[#070A12] ring-2 ring-[#29D3C2]/30 shadow-[0_0_20px_-5px_rgba(41,211,194,0.3)]"
              : "border-[#242B39] bg-[#0D111B] hover:border-[#29D3C2]/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-[#29D3C2]" />
              <span className="font-bold text-sm text-[#F3F5FA]">
                Reference 2 — Dark Theme
              </span>
            </div>
            {theme === "dark" && (
              <CheckCircle2 className="w-4 h-4 text-[#29D3C2]" />
            )}
          </div>
          <p className="mt-2 text-xs text-[#9AA4B5] leading-relaxed">
            Deep near-black (#070A12), cyan (#29D3C2) accents, tech-violet (#8B7CFF), subtle glow, and technical cyber graph aesthetic.
          </p>
          <div className="mt-4 flex gap-1.5">
            <span className="h-4 w-4 rounded-full bg-[#070A12] border border-[#242B39]" />
            <span className="h-4 w-4 rounded-full bg-[#0D111B]" />
            <span className="h-4 w-4 rounded-full bg-[#29D3C2]" />
            <span className="h-4 w-4 rounded-full bg-[#8B7CFF]" />
            <span className="h-4 w-4 rounded-full bg-[#F3C969]" />
          </div>
        </button>
      </div>
    </section>
  );
}
