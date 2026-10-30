"use client";

import { Plus } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

interface WelcomeSectionProps {
  onAddRepository?: () => void;
}

export function WelcomeSection({ onAddRepository }: WelcomeSectionProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();

  const userName = user?.name?.trim();
  const greeting = userName ? `Welcome back, ${userName}!` : "Welcome to CodeAtlas";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {greeting}
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--text-secondary)] max-w-2xl leading-relaxed">
          Your workspace for understanding codebases, exploring dependencies, and tracing software workflows.
        </p>
      </div>

      {onAddRepository && (
        <button
          type="button"
          onClick={onAddRepository}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
            isDark
              ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8] shadow-[0_0_15px_-3px_rgba(41,211,194,0.3)]"
              : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Repository
        </button>
      )}
    </div>
  );
}
