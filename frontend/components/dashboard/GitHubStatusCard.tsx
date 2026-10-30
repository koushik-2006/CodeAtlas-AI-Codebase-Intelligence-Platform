"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useGitHub } from "@/hooks/useGitHub";
import { Github } from "@/components/Icons";
import {
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  FolderGit2,
  LogOut,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

interface GitHubStatusCardProps {
  onBrowseRepositories?: () => void;
  className?: string;
  variant?: "full" | "compact";
}

export function GitHubStatusCard({
  onBrowseRepositories,
  className = "",
  variant = "full",
}: GitHubStatusCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const {
    status,
    loading,
    actionLoading,
    refreshStatus,
    connectGitHub,
    disconnectGitHub,
  } = useGitHub();

  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  if (loading) {
    return (
      <div
        className={`rounded-3xl border p-6 flex items-center justify-center min-h-[160px] ${
          isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-sm"
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
          <span>Loading GitHub integration status...</span>
        </div>
      </div>
    );
  }

  // --- 1. CONNECTED STATE ---
  if (status.connected) {
    return (
      <div
        className={`rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
          isDark
            ? "bg-[#0D111B] border-[#242B39] shadow-[0_0_30px_-10px_rgba(41,211,194,0.1)]"
            : "bg-white border-[#E8E5F4] shadow-sm"
        } ${className}`}
      >
        <div>
          {/* Header: Title, Status Badge, and Refresh Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#24292e] text-white shrink-0">
                <Github className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  GitHub Account
                </h3>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  Authorized REST Integration
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#2FD6A0]/15 text-[#2FD6A0] border border-[#2FD6A0]/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>

              <button
                type="button"
                onClick={() => refreshStatus()}
                disabled={actionLoading}
                title="Refresh GitHub repositories and account data"
                className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="mt-5 flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)]">
            <div className="flex items-center gap-3.5 min-w-0">
              {status.avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={status.avatar}
                  alt={status.username || "GitHub Avatar"}
                  className="h-11 w-11 rounded-2xl border border-[var(--border-color)] object-cover shadow-sm shrink-0"
                />
              ) : (
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--primary)] text-white font-bold text-sm shrink-0">
                  {status.username?.slice(0, 2).toUpperCase() || "GH"}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                    @{status.username}
                  </span>
                  {status.isSandbox && (
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Sandbox
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {status.repoCount} {status.repoCount === 1 ? "repository" : "repositories"} accessible
                </p>
              </div>
            </div>

            <a
              href={`https://github.com/${status.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
              title="Open GitHub profile"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <p className="mt-3.5 text-xs text-[var(--text-secondary)] leading-relaxed">
            Authorized repository permissions enable automated AST parsing, call-graph extraction, and verifiable file receipts across pull requests.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onBrowseRepositories && (
              <button
                type="button"
                onClick={onBrowseRepositories}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                  isDark
                    ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                    : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                Browse Repositories
              </button>
            )}
          </div>

          {confirmDisconnect ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500 font-semibold">Disconnect?</span>
              <button
                type="button"
                onClick={async () => {
                  await disconnectGitHub();
                  setConfirmDisconnect(false);
                }}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Yes, Disconnect
              </button>
              <button
                type="button"
                onClick={() => setConfirmDisconnect(false)}
                className="px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDisconnect(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-red-500 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect GitHub
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- 2. NOT CONNECTED STATE ---
  return (
    <div
      className={`rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-sm"
      } ${className}`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--border-color)]/40 text-[var(--text-primary)] shrink-0">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                GitHub not connected
              </h3>
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                OAuth 2.0 Integration
              </span>
            </div>
          </div>
          <span className="h-2 w-2 rounded-full bg-amber-500" title="Not connected" />
        </div>

        <p className="mt-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          Connect your GitHub account to analyze repositories, explore multi-tier symbol graphs, and generate pull request audits with verifiable receipts.
        </p>

        <div className="mt-4 p-3.5 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Zero Local Secret Exposure</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Your personal access token is exchanged exclusively on the CodeAtlas server and kept encrypted.
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
        <span className="text-[11px] font-mono text-[var(--text-secondary)]">
          Permissions: read:user, repo
        </span>

        <button
          type="button"
          onClick={connectGitHub}
          disabled={actionLoading}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
            isDark
              ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
              : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
          }`}
        >
          {actionLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Redirecting...</span>
            </>
          ) : (
            <>
              <Github className="w-3.5 h-3.5" />
              <span>Connect GitHub</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
