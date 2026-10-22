"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/components/ThemeProvider";
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  FileArchive,
  Globe,
  ExternalLink,
  Trash2,
  RotateCw,
  GitBranch,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  AlertCircle,
} from "lucide-react";
import { Github } from "@/components/Icons";

interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string;
  visibility: "public" | "private";
  language: string;
  lastAnalyzed: string;
  status: "ready" | "indexing" | "error";
  progress: number;
  symbolCount: number;
  connectionType: "github" | "zip" | "git_url";
}

const INITIAL_REPOSITORIES: Repository[] = [
  {
    id: "my-project",
    name: "my-project",
    owner: "koush-dev",
    description: "Core authentication and user service pipeline with FastAPI & React.",
    visibility: "private",
    language: "Python",
    lastAnalyzed: "12 mins ago",
    status: "ready",
    progress: 100,
    symbolCount: 6,
    connectionType: "github",
  },
  {
    id: "ecommerce-platform",
    name: "ecommerce-platform",
    owner: "org-scale",
    description: "High-throughput checkout orchestration and inventory management.",
    visibility: "private",
    language: "TypeScript",
    lastAnalyzed: "2 hours ago",
    status: "ready",
    progress: 100,
    symbolCount: 142,
    connectionType: "github",
  },
  {
    id: "auth-service",
    name: "auth-service",
    owner: "koush-dev",
    description: "OAuth2 and JWT token validation microservice.",
    visibility: "public",
    language: "Go",
    lastAnalyzed: "1 day ago",
    status: "indexing",
    progress: 68,
    symbolCount: 38,
    connectionType: "git_url",
  },
  {
    id: "fastapi-backend",
    name: "fastapi-backend",
    owner: "team-infra",
    description: "RESTful API backend for analytics aggregation and reporting.",
    visibility: "public",
    language: "Python",
    lastAnalyzed: "3 days ago",
    status: "ready",
    progress: 100,
    symbolCount: 94,
    connectionType: "zip",
  },
];

export default function RepositoriesPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [repos, setRepos] = useState<Repository[]>(INITIAL_REPOSITORIES);
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Repo Form State
  const [addMethod, setAddMethod] = useState<"github" | "zip" | "url">("github");
  const [repoNameInput, setRepoNameInput] = useState("");
  const [repoUrlInput, setRepoUrlInput] = useState("");

  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchesLang =
      langFilter === "all" || r.language.toLowerCase() === langFilter.toLowerCase();
    const matchesVisibility =
      visibilityFilter === "all" || r.visibility === visibilityFilter;
    return matchesSearch && matchesLang && matchesVisibility;
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this repository from CodeAtlas?")) {
      setRepos(repos.filter((r) => r.id !== id));
    }
  };

  const handleReanalyze = (id: string) => {
    setRepos(
      repos.map((r) =>
        r.id === id ? { ...r, status: "indexing", progress: 20 } : r
      )
    );
    setTimeout(() => {
      setRepos((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "ready", progress: 100, lastAnalyzed: "Just now" }
            : r
        )
      );
    }, 2000);
  };

  const handleAddRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoNameInput) return;

    const newRepo: Repository = {
      id: repoNameInput.toLowerCase().replace(/\s+/g, "-"),
      name: repoNameInput,
      owner: "you",
      description: repoUrlInput || "Imported code repository ready for symbol parsing.",
      visibility: "private",
      language: "TypeScript",
      lastAnalyzed: "Just now",
      status: "indexing",
      progress: 45,
      symbolCount: 18,
      connectionType: addMethod === "url" ? "git_url" : addMethod === "zip" ? "zip" : "github",
    };

    setRepos([newRepo, ...repos]);
    setIsAddModalOpen(false);
    setRepoNameInput("");
    setRepoUrlInput("");
  };

  return (
    <div>
      <PageHeader
        title="My Repositories"
        sub="Manage indexed codebases, review symbol maps, and trigger architecture updates."
      />

      {/* Header Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter repositories..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                isDark
                  ? "bg-[#0D111B] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
              }`}
            />
          </div>

          {/* Language filter */}
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
              isDark
                ? "bg-[#0D111B] border-[#242B39] text-[#F3F5FA]"
                : "bg-white border-[#E8E5F4] text-[#19143D]"
            }`}
          >
            <option value="all">All Languages</option>
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
            <option value="go">Go</option>
          </select>

          {/* Visibility filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
              isDark
                ? "bg-[#0D111B] border-[#242B39] text-[#F3F5FA]"
                : "bg-white border-[#E8E5F4] text-[#19143D]"
            }`}
          >
            <option value="all">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        {/* Add Repository Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 ${
            isDark
              ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
              : "bg-[#6C4DFF] text-white hover:bg-[#5838e6]"
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Repository
        </button>
      </div>

      {/* Repositories Grid */}
      {filteredRepos.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className={`app-card p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isDark ? "bg-[#111725] text-[#29D3C2]" : "bg-[#FAF9FF] text-[#6C4DFF]"
                      }`}
                    >
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href="/assistant"
                          className="text-lg font-bold hover:text-[var(--primary)] transition-colors"
                        >
                          {repo.name}
                        </Link>
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full ${
                            repo.visibility === "private"
                              ? isDark
                                ? "bg-[#8B7CFF]/15 text-[#8B7CFF]"
                                : "bg-[#EAE5FF] text-[#6C4DFF]"
                              : isDark
                              ? "bg-[#29D3C2]/15 text-[#29D3C2]"
                              : "bg-[#D7F7EA] text-[#1BA97B]"
                          }`}
                        >
                          {repo.visibility === "private" ? (
                            <Lock className="w-2.5 h-2.5" />
                          ) : (
                            <Unlock className="w-2.5 h-2.5" />
                          )}
                          {repo.visibility}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-[var(--text-secondary)]">
                        {repo.owner}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                      repo.status === "ready"
                        ? isDark
                          ? "bg-[#2FD6A0]/10 text-[#2FD6A0]"
                          : "bg-[#D7F7EA] text-[#1BA97B]"
                        : isDark
                        ? "bg-[#F3C969]/15 text-[#F3C969]"
                        : "bg-[#FFF0BF] text-[#B38300]"
                    }`}
                  >
                    {repo.status === "ready" ? "Indexed 100%" : `Indexing ${repo.progress}%`}
                  </span>
                </div>

                <p className="mt-3.5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {repo.description}
                </p>

                {/* Indexing Progress Indicator */}
                {repo.status === "indexing" && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                        style={{ width: `${repo.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Meta & Actions */}
              <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-[var(--text-secondary)] font-mono text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                    {repo.language}
                  </span>
                  <span>{repo.symbolCount} symbols</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {repo.lastAnalyzed}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/assistant"
                    className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Open in Code Explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/architecture"
                    className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="View Architecture Map"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleReanalyze(repo.id)}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Re-analyze repository"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(repo.id)}
                    className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-red-500 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                    title="Remove repository"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="app-card p-12 text-center max-w-lg mx-auto">
          <FolderGit2 className="w-12 h-12 mx-auto text-[var(--text-secondary)]/50 mb-4" />
          <h3 className="text-xl font-bold">No repositories found</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            No repositories match your filter query. Clear filters or add a new codebase to get started.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setLangFilter("all");
              setVisibilityFilter("all");
            }}
            className="mt-6 px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-color)]"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Add Repository Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
              isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <h3 className="text-xl font-bold">Add Repository</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingestion Method Tabs */}
            <div className="flex gap-2 my-5">
              {[
                { id: "github", label: "GitHub", icon: Github },
                { id: "zip", label: "Upload ZIP", icon: FileArchive },
                { id: "url", label: "Public URL", icon: Globe },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = addMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setAddMethod(m.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? isDark
                          ? "bg-[#29D3C2] text-[#070A12] border-[#29D3C2]"
                          : "bg-[#6C4DFF] text-white border-[#6C4DFF]"
                        : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]/20"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAddRepo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                  Repository Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. backend-api or mobile-client"
                  value={repoNameInput}
                  onChange={(e) => setRepoNameInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                    isDark
                      ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                      : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
                  }`}
                />
              </div>

              {addMethod === "url" && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                    Git Clone URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/org/repo.git"
                    value={repoUrlInput}
                    onChange={(e) => setRepoUrlInput(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                      isDark
                        ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                        : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
                    }`}
                  />
                </div>
              )}

              {addMethod === "zip" && (
                <div className="border-2 border-dashed border-[var(--border-color)] rounded-2xl p-6 text-center">
                  <FileArchive className="w-8 h-8 mx-auto text-[var(--text-secondary)] mb-2" />
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    Drag and drop your project ZIP or TAR archive
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)]/70 mt-1">
                    Maximum 200MB archive size
                  </p>
                </div>
              )}

              {addMethod === "github" && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)] mb-1">
                    GitHub OAuth Integration
                  </p>
                  CodeAtlas will request read-only metadata access to parse AST symbols and build call graphs.
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-color)] text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold ${
                    isDark
                      ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                      : "bg-[#6C4DFF] text-white hover:bg-[#5838e6]"
                  }`}
                >
                  Start Analysis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
