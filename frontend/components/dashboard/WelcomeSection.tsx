"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Sparkles,
  Calendar,
  Building2,
  User,
  ChevronDown,
  Check,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaces } from "@/hooks/useWorkspaces";

interface WelcomeSectionProps {
  onAddRepository?: () => void;
}

export function WelcomeSection({ onAddRepository }: WelcomeSectionProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspaceId, loading: workspacesLoading } = useWorkspaces();
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  // Close workspace dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWorkspaceMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between pb-2">
      <div className="flex items-start sm:items-center gap-4">
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
          {/* Workspace Switcher + Today's Date */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-[var(--text-secondary)] mb-1">
            {/* Workspace Selector Dropdown */}
            <div className="relative" ref={workspaceDropdownRef}>
              <button
                type="button"
                onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                aria-expanded={isWorkspaceMenuOpen}
                aria-haspopup="listbox"
                aria-label="Current workspace switcher"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold transition-all text-xs ${
                  isDark
                    ? "bg-[#111726] border-[#242B39] text-[var(--text-primary)] hover:border-[#7C5CFC]/60"
                    : "bg-white border-[#E8E5F4] text-[var(--text-primary)] hover:border-[#7C5CFC]/40 shadow-2xs"
                }`}
              >
                {activeWorkspace?.isPersonal ? (
                  <User className="w-3.5 h-3.5 text-[#7C5CFC]" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-[#7C5CFC]" />
                )}
                <span className="max-w-[160px] sm:max-w-[200px] truncate">
                  {workspacesLoading
                    ? "Loading workspace..."
                    : activeWorkspace?.name || "Default Workspace"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-[var(--text-secondary)] ${isWorkspaceMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isWorkspaceMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Available workspaces"
                  className={`absolute left-0 mt-2 w-72 z-50 rounded-2xl border p-2 shadow-2xl animate-in fade-in zoom-in-95 ${
                    isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
                  }`}
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Workspaces
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {workspaces.map((w) => {
                      const isSelected = w.id === activeWorkspace?.id;
                      return (
                        <button
                          key={w.id}
                          role="option"
                          aria-selected={isSelected}
                          type="button"
                          onClick={() => {
                            setActiveWorkspaceId(w.id);
                            setIsWorkspaceMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                            isSelected
                              ? isDark
                                ? "bg-[#7C5CFC]/20 text-white font-bold border border-[#7C5CFC]/40"
                                : "bg-[#7C5CFC]/10 text-[#7C5CFC] font-bold border border-[#7C5CFC]/20"
                              : isDark
                              ? "hover:bg-white/5 text-[var(--text-primary)]"
                              : "hover:bg-gray-100 text-[var(--text-primary)]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {w.isPersonal ? (
                              <User className="w-4 h-4 text-purple-400 shrink-0" />
                            ) : (
                              <Building2 className="w-4 h-4 text-[#7C5CFC] shrink-0" />
                            )}
                            <div className="truncate">
                              <p className="truncate font-semibold">{w.name}</p>
                              <p className="text-[10px] text-[var(--text-secondary)] truncate">
                                {w.repoCount || 2} repos &bull; {w.memberCount || 1} members
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#7C5CFC] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-1 border-t border-[var(--border-color)]">
                    <Link
                      href="/workspaces"
                      onClick={() => setIsWorkspaceMenuOpen(false)}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                    >
                      <span>Manage All Workspaces</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <span className="text-[var(--text-secondary)]/40 hidden sm:inline">&bull;</span>

            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {timeGreeting}, {firstName}
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Deterministically explore architectural dependencies, trace workflows, and analyze codebase impact.
          </p>
        </div>
      </div>

      {/* Action Buttons: Ask AI + Add Repository */}
      <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
        <Link
          href="/assistant"
          aria-label="Ask AI Assistant"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--primary)]/60 hover:text-[var(--primary)] shadow-sm transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          <span>Ask AI</span>
        </Link>

        {onAddRepository && (
          <button
            type="button"
            onClick={onAddRepository}
            aria-label="Add new repository"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
              isDark
                ? "bg-[#7C5CFC] text-white hover:bg-[#6847F0] shadow-[0_0_20px_-4px_rgba(124,92,252,0.4)]"
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
