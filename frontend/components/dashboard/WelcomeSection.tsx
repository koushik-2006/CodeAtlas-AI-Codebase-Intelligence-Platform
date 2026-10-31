"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus, Sparkles, Calendar } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

interface WelcomeSectionProps {
  onAddRepository?: () => void;
}

export function WelcomeSection({ onAddRepository }: WelcomeSectionProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();

  const { timeGreeting, firstName, formattedDate } = useMemo(() => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const name = user?.name ? user.name.trim().split(/\s+/)[0] : "Developer";
    const dateStr = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date());

    return { timeGreeting: greeting, firstName: name, formattedDate: dateStr };
  }, [user]);

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "DV";

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between pb-2">
      <div className="flex items-center gap-4">
        {/* Real User Avatar or Brand Purple Initials */}
        <div className="relative shrink-0">
          {user?.avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.avatar}
              alt={user.name || "User Avatar"}
              referrerPolicy="no-referrer"
              className="h-14 w-14 rounded-2xl object-cover border-2 border-[var(--border-color)] shadow-md"
            />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-[#7C5CFC]/15 text-[#7C5CFC] font-extrabold text-lg grid place-items-center border-2 border-[#7C5CFC]/20 shadow-md">
              {initials}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-page)]" />
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] mb-0.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {timeGreeting}, {firstName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Deterministically explore architectural dependencies, trace workflows, and analyze codebase impact.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
        <Link
          href="/assistant"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--primary)]/60 hover:text-[var(--primary)] shadow-sm transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          <span>Ask AI</span>
        </Link>

        {onAddRepository && (
          <button
            type="button"
            onClick={onAddRepository}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
              isDark
                ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8] shadow-[0_0_20px_-4px_rgba(41,211,194,0.35)]"
                : "bg-[#7C5CFC] text-white hover:bg-[#6847F0] shadow-[0_0_20px_-4px_rgba(124,92,252,0.35)]"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Repository</span>
          </button>
        )}
      </div>
    </div>
  );
}
