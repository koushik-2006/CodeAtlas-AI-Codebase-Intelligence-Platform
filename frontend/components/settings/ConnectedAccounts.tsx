"use client";
import { isDemoMode } from "@/lib/demo/mock-api";

import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Github } from "@/components/Icons";
import { ShieldCheck, CheckCircle2, AlertCircle, Sparkles, ExternalLink, RefreshCw } from "lucide-react";
import { apiClient } from "@/services/api-client";

interface AccountStatus {
  connected: boolean;
  username: string | null;
  avatar: string | null;
  scopes: string[];
  connectedAt: string | null;
  isConfigured: boolean;
  isSandbox?: boolean;
}

export function ConnectedAccounts() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  const [githubStatus, setGithubStatus] = useState<AccountStatus>({
    connected: false,
    username: null,
    avatar: null,
    scopes: [],
    connectedAt: null,
    isConfigured: false,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>("/api/auth/github/status");
      const json = res.data || {};
      if (res.success && json) {
        setGithubStatus(json);
      }
    } catch (err) {
      console.warn("Failed to load GitHub status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check URL parameters for OAuth return or error
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const connected = params.get("connected");
      const error = params.get("error");
      const mode = params.get("mode");

      if (connected === "github") {
        setNotice({
          type: "success",
          text:
            mode === "sandbox"
              ? "Developer Sandbox connected! You can now browse and index sandbox repositories."
              : "GitHub account authorized successfully! Read-only metadata permissions granted.",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        setNotice({
          type: "error",
          text: `Authorization notice: ${decodeURIComponent(error)}`,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleConnect = () => {
    setActionLoading(true);
    if (isDemoMode()) {
      setActionLoading(false);
      return;
    }
    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");
    window.location.href = `${apiBase}/auth/github`;
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post<any>("/api/auth/github/disconnect");
      if (res.success) {
        setGithubStatus({
          connected: false,
          username: null,
          avatar: null,
          scopes: [],
          connectedAt: null,
          isConfigured: githubStatus.isConfigured,
        });
        setNotice({
          type: "info",
          text: "GitHub disconnected safely. Authorization tokens have been removed from the server.",
        });
      }
    } catch (err) {
      setNotice({ type: "error", text: "Failed to disconnect account. Please try again." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section
      className={`app-card p-6 sm:p-8 ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
      }`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <Github className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl font-bold tracking-tight">Connected Accounts & OAuth</h2>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          aria-label="Refresh status"
          className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {notice && (
        <div
          className={`mt-4 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium border ${
            notice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : notice.type === "error"
              ? "bg-red-500/10 border-red-500/20 text-red-500"
              : "bg-blue-500/10 border-blue-500/20 text-blue-500"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Primary Google Auth Section */}
      <div className="mt-6 p-5 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center border border-[var(--border-color)] shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">Google Authentication</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Primary Identity
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Signed in as {user?.email || "authenticated user"}. Provides zero-trust application session verification.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-center sm:text-right">
          Active Session
        </span>
      </div>

      {/* GitHub Integration Section */}
      <div className="mt-4 p-5 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center border border-[var(--border-color)]">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">GitHub Authorization</h3>
              {githubStatus.connected && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    githubStatus.isSandbox
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  }`}
                >
                  {githubStatus.isSandbox ? "Developer Sandbox" : "Authorized"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {githubStatus.connected
                ? `Connected as @${githubStatus.username}. Scopes: ${githubStatus.scopes.join(", ") || "read:user, repo"}. Tokens stored securely on server.`
                : githubStatus.isConfigured
                ? "Authorize GitHub to discover, import, and index your public or authorized private repositories."
                : "Configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to enable live GitHub OAuth."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {githubStatus.connected ? (
            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                isDark
                  ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8] border-[#29D3C2]"
                  : "bg-[#19143D] text-white hover:bg-[#2a225f] border-[#19143D]"
              }`}
            >
              Connect GitHub
            </button>
          )}
        </div>
      </div>

      {/* Security & Permissions Callout */}
      <div className="mt-4 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] space-y-1">
          <p className="font-bold text-[var(--text-primary)]">Zero-Trust Authorization & Security Safeguards</p>
          <p>
            CodeAtlas requests read-only repository metadata and code permissions. We never request write access, never execute untrusted repository code, and never expose OAuth secrets or tokens to the browser.
          </p>
        </div>
      </div>
    </section>
  );
}