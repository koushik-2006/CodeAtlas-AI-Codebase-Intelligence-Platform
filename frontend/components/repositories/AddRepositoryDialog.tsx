"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { Github } from "@/components/Icons";
import {
  FileArchive,
  Globe,
  X,
  Code2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Lock,
  Star,
  GitBranch,
  RefreshCw,
} from "lucide-react";
import { apiClient } from "@/services/api-client";

interface AddRepositoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    name: string,
    url: string,
    method: "github" | "zip" | "url" | "sample",
    options?: { owner?: string; language?: string; visibility?: "public" | "private" }
  ) => void | Promise<any>;
}

interface DiscoveredRepo {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  description: string;
  visibility: "public" | "private";
  language: string;
  defaultBranch: string;
  url: string;
  stars: number;
  updatedAt: string;
  isAlreadyIndexed: boolean;
}

export function AddRepositoryDialog({ isOpen, onClose, onAdd }: AddRepositoryDialogProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<"github" | "sample" | "zip" | "url">("github");
  const [repoName, setRepoName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [importingRepoName, setImportingRepoName] = useState<string | null>(null);
  const [importedRepoName, setImportedRepoName] = useState<string | null>(null);

  // GitHub discovery states
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [isSandbox, setIsSandbox] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [discoveredRepos, setDiscoveredRepos] = useState<DiscoveredRepo[]>([]);
  const [fetchingRepos, setFetchingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "public" | "private">("all");

  const modalRef = useRef<HTMLDivElement>(null);

  // Escape key handler & focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch GitHub discovery info when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const checkGitHub = async () => {
      try {
        setFetchingRepos(true);
        const statusRes = await apiClient.get<any>("/api/auth/github/status");
        const statusJson = statusRes.data || {};
        const isConnected = Boolean(statusRes.success && statusJson.connected);
        if (statusRes.success && statusJson) {
          setGithubConnected(statusJson.connected);
          setGithubUsername(statusJson.username);
          setIsConfigured(statusJson.isConfigured);
          setIsSandbox(statusJson.isSandbox);
        }

        // Fetch discoverable repositories only when connected
        if (isConnected) {
          const reposRes = await apiClient.get<any>("/api/github/repos");
          const reposJson = reposRes.data || {};
          const repoList = Array.isArray(reposRes.data) ? reposRes.data : reposJson.data;
          if (reposRes.success && Array.isArray(repoList)) {
            setDiscoveredRepos(repoList);
            if (reposJson.meta?.isSandbox) {
              setIsSandbox(true);
            }
          }
        } else {
          setDiscoveredRepos([]);
        }
      } catch (err) {
        console.warn("Failed to discover GitHub repositories:", err);
      } finally {
        setFetchingRepos(false);
      }
    };

    checkGitHub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (activeTab === "url" && !repoUrl.trim()) {
      setErrorMessage("Please enter a valid Git clone URL.");
      return;
    }

    if (activeTab !== "sample" && !repoName.trim()) {
      setErrorMessage("Please specify a repository name.");
      return;
    }

    setIsLoading(true);
    try {
      const parts = repoName.trim().split("/");
      const owner = parts.length > 1 ? parts[0] : (githubUsername || "you");
      const name = parts.length > 1 ? parts.slice(1).join("/") : parts[0];

      await onAdd(
        name,
        repoUrl.trim() || `https://github.com/${owner}/${name}`,
        activeTab,
        { owner, language: "TypeScript", visibility: "private" }
      );
      setRepoName("");
      setRepoUrl("");
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add repository.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDiscoveredRepo = async (repo: DiscoveredRepo) => {
    try {
      setImportingRepoName(repo.name);
      setErrorMessage("");
      await onAdd(repo.name, repo.url, "github", {
        owner: repo.owner,
        language: repo.language,
        visibility: repo.visibility,
      });
      setImportedRepoName(repo.name);
      setTimeout(() => {
        setImportingRepoName(null);
        setImportedRepoName(null);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to import repository.");
      setImportingRepoName(null);
    }
  };

  const handleStartWithSample = async (sampleType: "python" | "typescript") => {
    setIsLoading(true);
    try {
      await onAdd(
        sampleType === "python" ? "python-fastapi-sample" : "typescript-nextjs-sample",
        `https://github.com/codeatlas-demo/${sampleType}-sample`,
        "sample",
        {
          owner: "codeatlas-demo",
          language: sampleType === "python" ? "Python" : "TypeScript",
          visibility: "public",
        }
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add sample codebase.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDiscoveredRepos = discoveredRepos.filter((r) => {
    const matchesSearch =
      !repoSearch ||
      r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(repoSearch.toLowerCase());
    const matchesVisibility =
      visibilityFilter === "all" || r.visibility === visibilityFilter;
    return matchesSearch && matchesVisibility;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`w-full max-w-xl rounded-3xl border p-6 sm:p-7 shadow-2xl transition-all ${
          isDark ? "bg-[#161B22] border-[#30363D]" : "bg-white border-[#E5E5E0]"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div>
            <h3 id="modal-title" className="text-xl font-bold text-[var(--text-primary)]">
              Add Repository
            </h3>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Connect and index repositories with AST symbol parsing and call-graph analysis.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 my-4 overflow-x-auto pb-1" role="tablist">
          {[
            { id: "github", label: "Option A: GitHub", icon: Github },
            { id: "sample", label: "Option B: Code Sample", icon: Code2 },
            { id: "zip", label: "Upload ZIP", icon: FileArchive },
            { id: "url", label: "Public Git URL", icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setErrorMessage("");
                }}
                className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                  isSelected
                    ? isDark
                      ? "bg-[#29D3C2] text-[#070A12] border-[#29D3C2] shadow-sm"
                      : "bg-[#6C4DFF] text-white border-[#6C4DFF] shadow-sm"
                    : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Option A: GitHub Discovery & Direct Ingestion */}
        {activeTab === "github" && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)] text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                <span className="font-semibold text-[var(--text-primary)]">
                  {githubConnected
                    ? `Connected as @${githubUsername || "user"}`
                    : "GitHub Authorization"}
                </span>
                {isSandbox && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Developer Sandbox
                  </span>
                )}
              </div>

              {!githubConnected ? (
                <a
                  href={isConfigured ? "/api/auth/github" : "/api/auth/github?sandbox=true"}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isDark
                      ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                      : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
                  }`}
                >
                  {isConfigured ? "Connect GitHub" : "Connect Sandbox"}
                </a>
              ) : (
                <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                  Read-only AST access
                </span>
              )}
            </div>

            {/* Discovered Repositories List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  Available Repositories ({filteredDiscoveredRepos.length})
                </label>
                <div className="flex items-center gap-1.5">
                  {(["all", "public", "private"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVisibilityFilter(v)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                        visibilityFilter === v
                          ? "bg-[var(--primary)] text-white"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Filter by name or description..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none ${
                    isDark
                      ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3] focus:border-[#29D3C2]"
                      : "bg-white border-[#E5E5E0] text-[#1E2022] focus:border-[#6C4DFF]"
                  }`}
                />
              </div>

              {fetchingRepos ? (
                <div className="p-8 flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  <span>Loading authorized repositories...</span>
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredDiscoveredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isDark
                          ? "bg-[#0D1117] border-[#30363D] hover:border-[#29D3C2]"
                          : "bg-[#FAFAFB] border-[#E8E8EE] hover:border-[#6C4DFF]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">
                            {repo.fullName || repo.name}
                          </h4>
                          {repo.visibility === "private" && (
                            <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                          )}
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                            {repo.language}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                          {repo.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectDiscoveredRepo(repo)}
                        disabled={Boolean(importingRepoName) || isLoading}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                          importedRepoName === repo.name
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : repo.isAlreadyIndexed
                            ? "border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            : isDark
                            ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                            : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
                        }`}
                      >
                        {importingRepoName === repo.name ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{repo.isAlreadyIndexed ? "Re-indexing..." : "Importing..."}</span>
                          </>
                        ) : importedRepoName === repo.name ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Queued!</span>
                          </>
                        ) : repo.isAlreadyIndexed ? (
                          "Re-index"
                        ) : (
                          "Import & Index"
                        )}
                      </button>
                    </div>
                  ))}

                  {filteredDiscoveredRepos.length === 0 && (
                    <div className="p-6 text-center text-xs text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-2xl">
                      No repositories found matching your filter.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Repository Slug Input */}
            <form onSubmit={handleSubmit} className="pt-2 border-t border-[var(--border-color)] space-y-2">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
                Or import custom repository slug (e.g. acme-corp/service)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="owner/repository-name"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none ${
                    isDark
                      ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3] focus:border-[#29D3C2]"
                      : "bg-white border-[#E5E5E0] text-[#1E2022] focus:border-[#6C4DFF]"
                  }`}
                />
                <button
                  type="submit"
                  disabled={isLoading || !repoName.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isDark
                      ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8] disabled:opacity-40"
                      : "bg-[#1E2022] text-white hover:bg-[#2e3135] disabled:opacity-40"
                  }`}
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  Index
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Option B: Curated Code Samples */}
        {activeTab === "sample" && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Start immediately without connecting an external repository using curated code samples or pasting a snippet into CodeLens.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleStartWithSample("python")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isDark
                    ? "bg-[#0D1117] border-[#30363D] hover:border-[#29D3C2]"
                    : "bg-[#FAF9FF] border-[#E8E5F4] hover:border-[#6C4DFF]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[var(--primary)]">Python</span>
                  <CheckCircle2 className="w-4 h-4 text-[var(--text-secondary)]/50" />
                </div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">FastAPI Auth Service</h4>
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                  6 symbols, JWT validation & test suites.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleStartWithSample("typescript")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isDark
                    ? "bg-[#0D1117] border-[#30363D] hover:border-[#29D3C2]"
                    : "bg-[#FAF9FF] border-[#E8E5F4] hover:border-[#6C4DFF]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[#8B7CFF]">TypeScript</span>
                  <CheckCircle2 className="w-4 h-4 text-[var(--text-secondary)]/50" />
                </div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Next.js Checkout Engine</h4>
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                  React hooks, API routes & client forms.
                </p>
              </button>
            </div>

            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">Want to paste a snippet?</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/visual-explorer");
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold ${
                  isDark
                    ? "bg-[#8B7CFF] text-[#070A12] hover:bg-[#7a6aeb]"
                    : "bg-[#6C4DFF] text-white hover:bg-[#5838e6]"
                }`}
              >
                Open CodeLens Snippet Tool
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Option C: Upload ZIP */}
        {activeTab === "zip" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-[var(--border-color)] rounded-2xl p-6 text-center hover:border-[var(--primary)] transition-colors">
              <FileArchive className="w-8 h-8 mx-auto text-[var(--primary)] mb-2" />
              <p className="text-xs font-bold text-[var(--text-primary)]">
                Drag and drop project archive (.zip, .tar.gz)
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                Server-side AST parsing. Max 50MB archive size.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                placeholder="e.g. legacy-mono-service"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                  isDark
                    ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3] focus:border-[#29D3C2]"
                    : "bg-white border-[#E5E5E0] text-[#1E2022] focus:border-[#6C4DFF]"
                }`}
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-color)] text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-5 py-2 rounded-xl text-xs font-bold ${
                  isDark
                    ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                    : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
                }`}
              >
                Upload & Ingest
              </button>
            </div>
          </form>
        )}

        {/* Option D: Public Git URL */}
        {activeTab === "url" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                Public Git Repository URL
              </label>
              <input
                type="url"
                required
                placeholder="https://github.com/organization/project.git"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  if (!repoName) {
                    const match = e.target.value.match(/\/([^/]+?)(\.git)?$/);
                    if (match) setRepoName(match[1]);
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                  isDark
                    ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3] focus:border-[#29D3C2]"
                    : "bg-white border-[#E5E5E0] text-[#1E2022] focus:border-[#6C4DFF]"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                placeholder="project-name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                  isDark
                    ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3] focus:border-[#29D3C2]"
                    : "bg-white border-[#E5E5E0] text-[#1E2022] focus:border-[#6C4DFF]"
                }`}
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-color)] text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-5 py-2 rounded-xl text-xs font-bold ${
                  isDark
                    ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                    : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
                }`}
              >
                Clone & Analyze
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
