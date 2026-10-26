"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import {
  Users,
  Building2,
  User,
  Plus,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Eye,
  Search,
  CheckCircle2,
  FolderGit2,
  FileText,
  Activity,
} from "lucide-react";
import CreateWorkspaceModal from "@/components/workspace/CreateWorkspaceModal";

export default function WorkspacesPage() {
  const { workspaces, activeWorkspace, setActiveWorkspaceId, loading, refreshWorkspaces } = useWorkspaces();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWorkspaces = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const teamWorkspaces = filteredWorkspaces.filter((w) => !w.isPersonal);
  const personalWorkspaces = filteredWorkspaces.filter((w) => w.isPersonal);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <ShieldAlert className="w-3 h-3" />
            Owner
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Admin
          </span>
        );
      case "member":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Shield className="w-3 h-3" />
            Member
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-500/15 border border-gray-500/30 text-gray-400">
            <Eye className="w-3 h-3" />
            Viewer
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)]/60 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)]">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Team Workspaces
            </h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Organize repositories, collaborate on architecture blueprints, annotate code, and discuss AI reviews.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Team Workspace</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces by name or description..."
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && workspaces.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-44 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/40 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Team Workspaces Section */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Team Workspaces ({teamWorkspaces.length})
          </h2>
        </div>

        {teamWorkspaces.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-8 text-center bg-[var(--bg-card)]/40">
            <Building2 className="w-10 h-10 text-[var(--text-secondary)]/60 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              No team workspaces found
            </h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
              Create a team workspace to invite colleagues, share repository insights, and conduct collaborative code reviews.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary)]/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Workspace</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamWorkspaces.map((ws) => {
              const isActive = ws.id === activeWorkspace?.id;
              return (
                <div
                  key={ws.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                    isActive
                      ? "border-[var(--primary)]/60 bg-[var(--bg-card)] shadow-lg shadow-[var(--primary)]/5 ring-1 ring-[var(--primary)]/40"
                      : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-color)]/90"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] font-bold text-sm">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                            {ws.name}
                          </h3>
                          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                            /{ws.slug}
                          </span>
                        </div>
                      </div>
                      {getRoleBadge(ws.userRole)}
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                      {ws.description || "Shared workspace for collaborative code intelligence and repository knowledge."}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] py-2 border-y border-[var(--border-color)]/40 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span>{ws.memberCount} {ws.memberCount === 1 ? "member" : "members"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{ws.repoCount} {ws.repoCount === 1 ? "repo" : "repos"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => setActiveWorkspaceId(ws.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-[var(--primary)]/15 text-[var(--primary)] cursor-default"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
                      }`}
                    >
                      {isActive ? "Active Workspace" : "Switch To"}
                    </button>

                    <Link
                      href={`/workspaces/${ws.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Personal Workspaces Section */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Personal Workspaces ({personalWorkspaces.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personalWorkspaces.map((ws) => {
            const isActive = ws.id === activeWorkspace?.id;
            return (
              <div
                key={ws.id}
                className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  isActive
                    ? "border-[var(--primary)]/60 bg-[var(--bg-card)] shadow-lg shadow-[var(--primary)]/5 ring-1 ring-[var(--primary)]/40"
                    : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-color)]/90"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                          {ws.name}
                        </h3>
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                          /{ws.slug}
                        </span>
                      </div>
                    </div>
                    {getRoleBadge(ws.userRole)}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                    {ws.description || "Private workspace for personal repositories and individual code exploration."}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] py-2 border-y border-[var(--border-color)]/40 mb-4">
                    <div className="flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{ws.repoCount} {ws.repoCount === 1 ? "repo" : "repos"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setActiveWorkspaceId(ws.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--primary)]/15 text-[var(--primary)] cursor-default"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
                    }`}
                  >
                    {isActive ? "Active Workspace" : "Switch To"}
                  </button>

                  <Link
                    href={`/workspaces/${ws.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    <span>Open Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Workspace Modal */}
      {createModalOpen && (
        <CreateWorkspaceModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            refreshWorkspaces();
          }}
        />
      )}
    </div>
  );
}
