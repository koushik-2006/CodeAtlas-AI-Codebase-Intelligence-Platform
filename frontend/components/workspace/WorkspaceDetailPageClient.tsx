"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  FolderGit2,
  Share2,
  FileText,
  StickyNote,
  Settings as SettingsIcon,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Eye,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Activity,
  GitPullRequest,
  Search,
  Loader2,
  UserPlus,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { DbWorkspace, DbWorkspaceMember, DbSharedArtifact, DbCodeAnnotation, DbWorkspaceActivityEvent, WorkspaceRole } from "@/types/workspace";
import { apiClient } from "@/services/api-client";
import { DbRepository } from "@/types/database";
import InviteMemberModal from "@/components/workspace/InviteMemberModal";
import CreateArtifactModal from "@/components/workspace/CreateArtifactModal";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params.id as string;

  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const [workspace, setWorkspace] = useState<(DbWorkspace & { userRole: WorkspaceRole; members: DbWorkspaceMember[]; repoCount: number }) | null>(null);
  const [repositories, setRepositories] = useState<DbRepository[]>([]);
  const [artifacts, setArtifacts] = useState<DbSharedArtifact[]>([]);
  const [annotations, setAnnotations] = useState<DbCodeAnnotation[]>([]);
  const [activities, setActivities] = useState<DbWorkspaceActivityEvent[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createArtifactModalOpen, setCreateArtifactModalOpen] = useState(false);
  const [previewArtifact, setPreviewArtifact] = useState<DbSharedArtifact | null>(null);

  // Settings form state
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [allowInvites, setAllowInvites] = useState(true);
  const [requireReason, setRequireReason] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Delete workspace state
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);

  // Filter state
  const [activityCategory, setActivityCategory] = useState("all");
  const [artifactTypeFilter, setArtifactTypeFilter] = useState("all");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const fetchWorkspaceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Workspace Details
      const wsRes = await apiClient.get<any>(`/api/workspaces/${workspaceId}`);
      const wsJson = wsRes.data || {};
      if (!wsRes.success || !wsJson) {
        throw new Error(wsJson.error || wsRes.message || "Failed to load workspace");
      }
      const wsData = wsJson.data || wsJson;
      setWorkspace(wsData);
      setWsName(wsData.name);
      setWsDesc(wsData.description || "");
      setAllowInvites(wsData.settings?.allowMemberInvites ?? true);
      setRequireReason(wsData.settings?.requireReviewDismissalReason ?? true);

      // Fetch Repositories
      const repoRes = await apiClient.get<any>(`/api/workspaces/${workspaceId}/repositories`);
      const repoJson = repoRes.data || {};
      if (repoRes.success && (repoJson.repositories || repoJson.data?.repositories)) {
        setRepositories(repoJson.repositories || repoJson.data?.repositories);
      }

      // Fetch Artifacts
      const artRes = await apiClient.get<any>(`/api/workspaces/${workspaceId}/artifacts`);
      const artJson = artRes.data || {};
      if (artRes.success && (artJson.artifacts || artJson.data?.artifacts)) {
        setArtifacts(artJson.artifacts || artJson.data?.artifacts);
      }

      // Fetch Annotations
      const annRes = await apiClient.get<any>(`/api/workspaces/${workspaceId}/annotations?repoId=sample-project`);
      const annJson = annRes.data || {};
      if (annRes.success && (annJson.annotations || annJson.data?.annotations)) {
        setAnnotations(annJson.annotations || annJson.data?.annotations);
      }

      // Fetch Activities
      const actRes = await apiClient.get<any>(`/api/workspaces/${workspaceId}/activity`);
      const actJson = actRes.data || {};
      if (actRes.success && (actJson.items || actJson.data?.items)) {
        setActivities(actJson.items || actJson.data?.items);
      }

      // Fetch Invitations if user is admin or owner
      if (wsData.userRole === "owner" || wsData.userRole === "admin") {
        const invRes = await apiClient.get<any>(`/api/workspaces/${workspaceId}/invitations`);
        const invJson = invRes.data || {};
        if (invRes.success && (invJson.invitations || invJson.data?.invitations)) {
          setInvitations(invJson.invitations || invJson.data?.invitations);
        }
      }
    } catch (err: any) {
      console.error("fetchWorkspaceData error:", err);
      setError(err.message || "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  // Handle member role change
  const handleRoleChange = async (targetUserId: string, newRole: WorkspaceRole) => {
    try {
      const res = await apiClient.patch<any>(`/api/workspaces/${workspaceId}/members`, {
        targetUserId,
        role: newRole,
      });
      const json = res.data || {};
      if (!res.success) {
        alert(json.error || res.message || "Failed to update role");
        return;
      }
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  // Handle member removal
  const handleRemoveMember = async (targetUserId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;
    try {
      const res = await apiClient.delete<any>(`/api/workspaces/${workspaceId}/members?userId=${targetUserId}`);
      const json = res.data || {};
      if (!res.success) {
        alert(json.error || res.message || "Failed to remove member");
        return;
      }
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    }
  };

  // Handle invitation revocation
  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm("Revoke this pending invitation?")) return;
    try {
      const res = await apiClient.delete<any>(`/api/workspaces/${workspaceId}/invitations?invitationId=${invitationId}`);
      const json = res.data || {};
      if (!res.success) {
        alert(json.error || res.message || "Failed to revoke invitation");
        return;
      }
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.message || "Failed to revoke invitation");
    }
  };

  // Handle artifact deletion
  const handleDeleteArtifact = async (artifactId: string, title: string) => {
    if (!confirm(`Delete shared artifact '${title}'?`)) return;
    try {
      const res = await apiClient.delete<any>(`/api/workspaces/${workspaceId}/artifacts?artifactId=${artifactId}`);
      const json = res.data || {};
      if (!res.success) {
        alert(json.error || res.message || "Failed to delete artifact");
        return;
      }
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.message || "Failed to delete artifact");
    }
  };

  // Handle note deletion
  const handleDeleteAnnotation = async (annotationId: string) => {
    if (!confirm("Delete this code note?")) return;
    try {
      const res = await apiClient.delete<any>(`/api/workspaces/${workspaceId}/annotations?annotationId=${annotationId}`);
      const json = res.data || {};
      if (!res.success) {
        alert(json.error || res.message || "Failed to delete note");
        return;
      }
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.message || "Failed to delete note");
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsSuccess(false);
      const res = await apiClient.patch<any>(`/api/workspaces/${workspaceId}`, {
        name: wsName.trim(),
        description: wsDesc.trim(),
        settings: {
          allowMemberInvites: allowInvites,
          requireReviewDismissalReason: requireReason,
        },
      });
      const json = res.data || {};
      if (!res.success) {
        alert(json.error || res.message || "Failed to save settings");
        return;
      }
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Delete Workspace
  const handleDeleteWorkspace = async () => {
    if (deleteConfirmation !== workspace?.name) {
      alert("Please type the exact workspace name to confirm deletion");
      return;
    }
    try {
      setDeletingWorkspace(true);
      const res = await apiClient.delete<any>(`/api/workspaces/${workspaceId}`);
      const json = res.data || {};
      if (!res.success) {
        alert(json.error || res.message || "Failed to delete workspace");
        return;
      }
      router.push("/workspaces");
    } catch (err: any) {
      alert(err.message || "Failed to delete workspace");
    } finally {
      setDeletingWorkspace(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const host = window.location.host;
    const protocol = window.location.protocol;
    const url = `${protocol}//${host}/invitations/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading && !workspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-[var(--text-secondary)]">Loading workspace dashboard...</p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center justify-between">
          <span>{error || "Workspace not found or access denied."}</span>
          <Link href="/workspaces" className="px-4 py-1.5 rounded-xl bg-red-500/20 text-white font-medium hover:bg-red-500/30 transition-colors">
            Back to Workspaces
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = workspace.userRole === "owner";
  const isAdmin = workspace.userRole === "admin" || isOwner;
  const canManage = workspace.userRole === "owner" || workspace.userRole === "admin" || workspace.userRole === "member";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)]/60 pb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-purple-600/30 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--primary)] shadow-md shadow-[var(--primary)]/10">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {workspace.name}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] font-mono">
                /{workspace.slug}
              </span>
              <span className="capitalize text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]">
                {workspace.userRole}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl">
              {workspace.description || "Shared workspace for team collaboration, codebase knowledge, and architecture intelligence."}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 hover:bg-purple-500/25 text-xs font-semibold transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Teammate</span>
            </button>
          )}

          {canManage && (
            <button
              onClick={() => setCreateArtifactModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all hover:scale-[1.02]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Artifact</span>
            </button>
          )}
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--border-color)]/60 pb-2">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "repositories", label: `Repositories (${repositories.length})`, icon: FolderGit2 },
          { id: "artifacts", label: `Shared Artifacts (${artifacts.length})`, icon: Share2 },
          { id: "notes", label: `Notes & Annotations (${annotations.length})`, icon: StickyNote },
          { id: "members", label: `Members & Invites (${workspace.members.length})`, icon: Users },
          { id: "settings", label: "Settings", icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Connected Repos</span>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{repositories.length}</p>
            </div>
            <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Workspace Members</span>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{workspace.members.length}</p>
            </div>
            <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Shared Artifacts</span>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{artifacts.length}</p>
            </div>
            <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Code Annotations</span>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{annotations.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Repositories & Recent Artifacts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Repositories Quick View */}
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-[var(--primary)]" />
                    <span>Workspace Repositories</span>
                  </h3>
                  <button onClick={() => setActiveTab("repositories")} className="text-xs text-[var(--primary)] hover:underline">
                    View all ({repositories.length})
                  </button>
                </div>

                <div className="space-y-2.5">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className="p-3 rounded-xl border border-[var(--border-color)]/70 bg-[var(--bg-surface)]/50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FolderGit2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <Link href={`/repositories/${repo.id}`} className="font-semibold text-xs text-[var(--text-primary)] hover:underline truncate block">
                            {repo.name}
                          </Link>
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            {repo.language} · {repo.symbolCount} symbols · Last analyzed: {repo.lastAnalyzed || "Ready"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          Indexed
                        </span>
                        <Link
                          href={`/architecture?repoId=${repo.id}`}
                          className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/20"
                        >
                          Graph
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shared Artifacts Quick View */}
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-purple-400" />
                    <span>Recent Shared Knowledge Artifacts</span>
                  </h3>
                  <button onClick={() => setActiveTab("artifacts")} className="text-xs text-[var(--primary)] hover:underline">
                    View all ({artifacts.length})
                  </button>
                </div>

                {artifacts.length === 0 ? (
                  <p className="text-xs text-[var(--text-secondary)] text-center py-6">
                    No shared artifacts yet. Save architecture blueprints or impact reports for your team.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {artifacts.slice(0, 3).map((art) => (
                      <div
                        key={art.id}
                        className="p-3.5 rounded-xl border border-[var(--border-color)]/70 bg-[var(--bg-surface)]/50 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xs font-bold text-[var(--text-primary)]">{art.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)] capitalize">
                              {art.type.replace(/_/g, " ")}
                            </span>
                            {art.isStale && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center gap-1" title="Repository revision changed">
                                <AlertTriangle className="w-3 h-3" />
                                Stale Revision
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">
                            {art.description}
                          </p>
                          <span className="text-[10px] text-[var(--text-secondary)]/80 mt-1 block">
                            Created by {art.creatorName} · {new Date(art.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <button
                          onClick={() => setPreviewArtifact(art)}
                          className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-xs text-[var(--primary)] hover:bg-[var(--border-color)]/20 whitespace-nowrap"
                        >
                          View Artifact
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Team Activity Timeline */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Team Activity Feed</span>
                </h3>
              </div>

              {activities.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] text-center py-8">
                  No activity recorded yet.
                </p>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
                  {activities.slice(0, 10).map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {act.actorName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[var(--text-primary)] leading-tight">
                          <strong>{act.actorName}</strong> {act.action}
                        </p>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {new Date(act.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPOSITORIES */}
      {activeTab === "repositories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Connected Repositories</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Repositories linked to this workspace. Team members can explore architecture, symbols, and impact.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <FolderGit2 className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">{repo.name}</h3>
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono">{repo.owner}/{repo.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      Indexed
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4">
                    {repo.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-[var(--border-color)]/40 mb-4 text-center">
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] block">Language</span>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{repo.language}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] block">Symbols</span>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{repo.symbolCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] block">Files</span>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{repo.fileCount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    Freshness: {repo.lastAnalyzed || "Recently Indexed"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/architecture?repoId=${repo.id}`}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-color)]/20 transition-colors"
                    >
                      Architecture
                    </Link>
                    <Link
                      href={`/repositories/${repo.id}`}
                      className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary)]/90 transition-colors"
                    >
                      Explore Code
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SHARED ARTIFACTS */}
      {activeTab === "artifacts" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Shared Knowledge Artifacts</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Permanent blueprints, impact assessments, and guides saved by team members.
              </p>
            </div>

            {canManage && (
              <button
                onClick={() => setCreateArtifactModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary)]/90 transition-all shadow-md shadow-[var(--primary)]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Shared Artifact</span>
              </button>
            )}
          </div>

          {artifacts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-8 text-center bg-[var(--bg-card)]/40">
              <Share2 className="w-10 h-10 text-[var(--text-secondary)]/60 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                No shared artifacts saved yet
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
                Capture architecture blueprints, impact analyses, or onboarding documentation to share with your workspace.
              </p>
              {canManage && (
                <button
                  onClick={() => setCreateArtifactModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary)]/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Artifact</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {artifacts.map((art) => (
                <div
                  key={art.id}
                  className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--primary)]" />
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">{art.title}</h3>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)] capitalize">
                        {art.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    {art.isStale && (
                      <div className="mb-3 p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Repository was re-analyzed after this artifact was generated. Content may reference older revisions.</span>
                      </div>
                    )}

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4">
                      {art.description}
                    </p>

                    <div className="p-3 rounded-xl bg-[var(--bg-surface)]/60 font-mono text-[11px] text-[var(--text-secondary)] line-clamp-3 mb-4">
                      {art.content}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]/60">
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      By {art.creatorName} · {new Date(art.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewArtifact(art)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] hover:bg-[var(--primary)]/25 text-xs font-semibold transition-colors"
                      >
                        Read Full Artifact
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteArtifact(art.id, art.title)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete artifact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: NOTES & ANNOTATIONS */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Collaborative Code Notes</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Architectural decisions, limitations, and annotations anchored to code symbols and line ranges.
              </p>
            </div>
          </div>

          {annotations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-8 text-center bg-[var(--bg-card)]/40">
              <StickyNote className="w-10 h-10 text-[var(--text-secondary)]/60 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                No code notes added yet
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Add annotations directly from the Code Explorer or architecture views to preserve team knowledge.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Link
                        href={`/repositories/${ann.repositoryId}?file=${encodeURIComponent(ann.filePath)}&line=${ann.startLine}`}
                        className="font-mono text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                      >
                        <span>{ann.filePath}:{ann.startLine}-{ann.endLine}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      {ann.symbolName && (
                        <span className="text-[10px] px-2 py-0.2 rounded font-mono border border-[var(--border-color)] text-[var(--text-secondary)]">
                          {ann.symbolName}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.2 rounded-full uppercase tracking-wider font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-400">
                        {ann.category}
                      </span>
                      {ann.isStale && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Stale Lines
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </p>

                    <span className="text-[10px] text-[var(--text-secondary)] mt-2 block">
                      Added by <strong>{ann.authorName}</strong> on {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteAnnotation(ann.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MEMBERS & INVITATIONS */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Members Table */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Workspace Members</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Teammates with access to repositories and shared workspace intelligence.
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary)]/90 transition-all shadow-md shadow-[var(--primary)]/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Teammate</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-[var(--border-color)]/60">
              {workspace.members.map((member) => {
                const isCurrentUser = member.userId === "usr_default";
                return (
                  <div key={member.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                        {(member.userName || member.userId).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[var(--text-primary)]">
                            {member.userName || member.userId}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded border border-[var(--border-color)] text-[var(--text-secondary)]">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          {member.userEmail || `${member.userId}@codeatlas.dev`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Role selection / indicator */}
                      {isAdmin && !workspace.isPersonal ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.userId, e.target.value as WorkspaceRole)}
                          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] capitalize"
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="capitalize text-xs px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)]">
                          {member.role}
                        </span>
                      )}

                      {isAdmin && !isCurrentUser && !workspace.isPersonal && (
                        <button
                          onClick={() => handleRemoveMember(member.userId, member.userName || member.userId)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Invitations Section */}
          {isAdmin && (
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Pending Invitations</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Invitations waiting to be accepted by recipients.
              </p>

              {invitations.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4 italic">
                  No pending invitations at this time.
                </p>
              ) : (
                <div className="divide-y divide-[var(--border-color)]/60">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[var(--text-primary)]">{inv.email}</span>
                          <span className="capitalize text-[10px] px-2 py-0.2 rounded border border-[var(--border-color)] text-[var(--text-secondary)]">
                            {inv.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          Invited on {new Date(inv.createdAt).toLocaleDateString()} · Expires in {Math.max(0, Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {inv.token && (
                          <button
                            onClick={() => copyInviteLink(inv.token)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-xs text-[var(--primary)] hover:bg-[var(--border-color)]/20 transition-colors"
                          >
                            {copiedLink === inv.token ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedLink === inv.token ? "Copied" : "Copy Link"}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="px-2.5 py-1 rounded-lg border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-6 max-w-2xl">
          {/* General Workspace Settings */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Workspace Settings</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-5">
              Manage workspace name, description, and collaboration access policies.
            </p>

            {settingsSuccess && (
              <div className="mb-4 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Workspace settings updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={wsDesc}
                  onChange={(e) => setWsDesc(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-2.5 pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowInvites}
                    onChange={(e) => setAllowInvites(e.target.checked)}
                    className="mt-0.5 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    disabled={!isAdmin}
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    Allow workspace members and admins to send invitations
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireReason}
                    onChange={(e) => setRequireReason(e.target.checked)}
                    className="mt-0.5 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    disabled={!isAdmin}
                  />
                  <span className="text-xs text-[var(--text-secondary)]">
                    Enforce written justification when dismissing code review findings
                  </span>
                </label>
              </div>

              {isAdmin && (
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-medium transition-all shadow-md shadow-[var(--primary)]/20 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Settings</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Danger Zone: Delete Workspace */}
          {isOwner && !workspace.isPersonal && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
              <h3 className="text-sm font-bold text-red-400 mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone: Delete Workspace</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Permanently deletes this workspace and its shared artifacts, discussions, and annotations. The original repositories and users are NOT deleted.
              </p>

              <div className="space-y-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  To confirm, type <strong>{workspace.name}</strong> below:
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={workspace.name}
                    className="flex-1 rounded-xl border border-red-500/30 bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleDeleteWorkspace}
                    disabled={deletingWorkspace || deleteConfirmation !== workspace.name}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    {deletingWorkspace ? "Deleting..." : "Delete Workspace"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {inviteModalOpen && (
        <InviteMemberModal
          isOpen={inviteModalOpen}
          workspaceId={workspaceId}
          workspaceName={workspace.name}
          onClose={() => setInviteModalOpen(false)}
          onSuccess={() => {
            fetchWorkspaceData();
          }}
        />
      )}

      {createArtifactModalOpen && (
        <CreateArtifactModal
          isOpen={createArtifactModalOpen}
          workspaceId={workspaceId}
          repositories={repositories.map((r) => ({ id: r.id, name: r.name }))}
          onClose={() => setCreateArtifactModalOpen(false)}
          onSuccess={() => {
            setCreateArtifactModalOpen(false);
            fetchWorkspaceData();
          }}
        />
      )}

      {/* Artifact Preview Drawer / Modal */}
      {previewArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-6 relative">
            <button
              onClick={() => setPreviewArtifact(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)] capitalize font-semibold">
                  {previewArtifact.type.replace(/_/g, " ")}
                </span>
                {previewArtifact.isStale && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    Stale Revision
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{previewArtifact.title}</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{previewArtifact.description}</p>
              <span className="text-[10px] text-[var(--text-secondary)]/80 mt-1 block">
                Created by {previewArtifact.creatorName} · {new Date(previewArtifact.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-surface)] whitespace-pre-wrap font-mono text-xs text-[var(--text-primary)] leading-relaxed">
              {previewArtifact.content}
            </div>

            <div className="flex items-center justify-end pt-4 mt-4 border-t border-[var(--border-color)]/60">
              <button
                onClick={() => setPreviewArtifact(null)}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary)]/90 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
