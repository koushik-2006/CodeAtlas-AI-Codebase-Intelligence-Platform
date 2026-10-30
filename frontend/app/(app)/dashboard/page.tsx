"use client";

import { useState, useEffect } from "react";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { CodebaseMetricsBar } from "@/components/dashboard/CodebaseMetricsBar";
import { QuickActionCards } from "@/components/dashboard/QuickActionCards";
import { RepositoryOverview } from "@/components/dashboard/RepositoryOverview";
import { GitHubStatusCard } from "@/components/dashboard/GitHubStatusCard";
import { GettingStartedChecklist } from "@/components/dashboard/GettingStartedChecklist";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";
import { AddRepositoryDialog } from "@/components/repositories/AddRepositoryDialog";
import { useRepositories } from "@/hooks/useRepositories";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function DashboardPage() {
  const [isAddRepoOpen, setIsAddRepoOpen] = useState(false);
  const [oauthNotice, setOauthNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { repositories, addRepository } = useRepositories();
  const activeRepoId = repositories[0]?.id || "sample-project";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const connected = params.get("connected");
      const error = params.get("error");
      const mode = params.get("mode");

      if (connected === "github") {
        setOauthNotice({
          type: "success",
          text:
            mode === "sandbox"
              ? "Developer Sandbox connected! You can now browse and index sandbox repositories."
              : "GitHub account authorized successfully! Real repositories and metadata are now available.",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        setOauthNotice({
          type: "error",
          text: `GitHub authorization error: ${decodeURIComponent(error)}`,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleAddRepo = async (
    name: string,
    url: string,
    method: "github" | "zip" | "url" | "sample",
    options?: { owner?: string; language?: string; visibility?: "public" | "private" }
  ) => {
    await addRepository({
      name,
      owner: options?.owner || "you",
      description: url || "Connected repository AST symbol analysis in progress.",
      visibility: options?.visibility || "private",
      language: options?.language || (method === "sample" && name.includes("python") ? "Python" : "TypeScript"),
      symbolCount: 18,
      connectionType: method === "url" ? "git_url" : method === "zip" ? "zip" : "github",
    });

    setOauthNotice({
      type: "success",
      text: `Repository "${name}" queued for indexing! Parsing AST symbols and extracting call-graph connections in background.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* OAuth Feedback Notice */}
      {oauthNotice && (
        <div
          role="status"
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-medium border shadow-sm transition-all animate-in fade-in ${
            oauthNotice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
              : "bg-red-500/10 border-red-500/30 text-red-500"
          }`}
        >
          <div className="flex items-center gap-3">
            {oauthNotice.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{oauthNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setOauthNotice(null)}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Welcome Section */}
      <WelcomeSection onAddRepository={() => setIsAddRepoOpen(true)} />

      {/* 2. Codebase Intelligence & Language Distribution Bar */}
      <CodebaseMetricsBar />

      {/* 3. Quick Action Cards (6 functional workflows) */}
      <QuickActionCards
        onConnectGitHub={() => setIsAddRepoOpen(true)}
        activeRepoId={activeRepoId}
      />

      {/* 4. Two-Column Workspace: GitHub Integration & Your Repositories */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <GitHubStatusCard onBrowseRepositories={() => setIsAddRepoOpen(true)} />
        <RepositoryOverview onAddRepository={() => setIsAddRepoOpen(true)} />
      </div>

      {/* 5. Getting Started Checklist */}
      <GettingStartedChecklist />

      {/* 6. Recent Activity Panel */}
      <RecentActivityPanel />

      {/* Add Repository Modal */}
      <AddRepositoryDialog
        isOpen={isAddRepoOpen}
        onClose={() => setIsAddRepoOpen(false)}
        onAdd={handleAddRepo}
      />
    </div>
  );
}

