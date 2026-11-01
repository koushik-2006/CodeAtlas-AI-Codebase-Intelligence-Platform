"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  FolderGit2,
  MessageSquare,
  StickyNote,
  Settings as SettingsIcon,
  Activity as ActivityIcon,
  ChevronRight,
  ChevronDown,
  Check,
  UserPlus,
  Loader2,
  AlertCircle,
  Sparkles,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
} from "lucide-react";
import { apiClient } from "@/services/api-client";
import { useWorkspaces } from "@/hooks/useWorkspaces";

// Subcomponents
import WorkspaceOverviewTab from "./tabs/WorkspaceOverviewTab";
import WorkspaceRepositoriesTab from "./tabs/WorkspaceRepositoriesTab";
import WorkspaceMembersTab from "./tabs/WorkspaceMembersTab";
import WorkspaceDiscussionsTab from "./tabs/WorkspaceDiscussionsTab";
import WorkspaceAnnotationsTab from "./tabs/WorkspaceAnnotationsTab";
import WorkspaceSettingsTab from "./tabs/WorkspaceSettingsTab";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Support static export fallback (?id=<id>) and standard route param
  const rawId = (params?.id as string) || "";
  const workspaceId =
    rawId === "view" ? searchParams.get("id") || "ws_team_demo" : rawId || "ws_team_demo";

  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const {
    workspaces: allWorkspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    refreshWorkspaces,
  } = useWorkspaces();

  const [workspace, setWorkspace] = useState<any | null>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  const fetchWorkspaceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch workspace detail
      const res = await apiClient.get<any>(`/api/workspaces/${workspaceId}`);
      const json = res.data || {};
      if (!res.success || !json) {
        throw new Error(json.error || res.message || "Failed to load workspace");
      }

      const wsData = json.workspace || json.data?.workspace || json.data || json;
      setWorkspace(wsData);

      // Extract collections
      const mems = json.members || json.data?.members || [];
      const repos = json.repositories || json.data?.repositories || [];
      const annos = json.annotations || json.data?.annotations || [];
      const acts = json.activity || json.data?.activity || [];
      const disc = json.discussions || json.data?.discussions || [];

      setMembers(mems);
      setRepositories(repos);
      setAnnotations(annos);
      setActivities(acts);
      setDiscussions(disc);

      // If user has admin/owner rights, fetch pending invitations & discussions
      try {
        const [invRes, discRes] = await Promise.all([
          apiClient.get<any>(`/api/workspaces/${workspaceId}/invitations`),
          apiClient.get<any>(`/api/workspaces/${workspaceId}/discussions`),
        ]);
        if (invRes.success && invRes.data?.invitations) {
          setInvitations(invRes.data.invitations);
        }
        if (discRes.success && (discRes.data?.discussions || (discRes as any).discussions)) {
          setDiscussions(discRes.data?.discussions || (discRes as any).discussions);
        }
      } catch {}
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

  // Keep activeTab in sync with query parameter if present
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  if (loading && !workspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center space-y-4">
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
          <Link
            href="/workspaces"
            className="px-4 py-1.5 rounded-xl bg-red-500/20 text-white font-medium hover:bg-red-500/30 transition-colors"
          >
            Back to Workspaces
          </Link>
        </div>
      </div>
    );
  }

  const isCurrentActive = activeWorkspace?.id === workspace.id;
  const userRole = workspace.userRole || "owner";
  const canManage = userRole === "owner" || userRole === "admin" || userRole === "member";

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            Owner
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </span>
        );
      case "member":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Shield className="w-3.5 h-3.5" />
            Member
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/15 border border-gray-500/30 text-gray-400">
            <Eye className="w-3.5 h-3.5" />
            Viewer
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <Link href="/workspaces" className="hover:text-[var(--text-primary)] transition-colors">
          Workspaces
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--text-primary)] font-semibold truncate">
          {workspace.name}
        </span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-color)]/60 pb-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl border flex items-center justify-center text-white shadow-md flex-shrink-0"
            style={{
              backgroundColor: workspace.color || "#7C5CFC",
              borderColor: `${workspace.color || "#7C5CFC"}80`,
            }}
          >
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
              {getRoleBadge(userRole)}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              {workspace.description ||
                "Shared workspace for team collaboration, codebase knowledge, and architecture intelligence."}
            </p>
          </div>
        </div>

        {/* Quick Workspace Switcher & Active Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Workspace Quick Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--border-color)]/30 text-xs font-semibold text-[var(--text-primary)] transition-colors"
            >
              <span>Switch Workspace</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {switcherOpen && (
              <div
                className="absolute right-0 top-11 z-30 w-56 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setSwitcherOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-color)]/60">
                  All Workspaces
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5 mt-1">
                  {allWorkspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setSwitcherOpen(false);
                        router.push(`/workspaces/${ws.id}`);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                        ws.id === workspace.id
                          ? "bg-[var(--primary)]/15 text-[var(--primary)] font-bold"
                          : "text-[var(--text-primary)] hover:bg-[var(--primary)]/10"
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === workspace.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Switch to this Workspace Button */}
          {!isCurrentActive ? (
            <button
              onClick={() => {
                setActiveWorkspaceId(workspace.id);
                showToast(`Switched active workspace to "${workspace.name}"`);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all hover:scale-[1.02]"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Switch to this Workspace</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Current Active Workspace</span>
            </span>
          )}
        </div>
      </div>

      {/* 6 Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--border-color)]/60 pb-2">
        {[
          { id: "overview", label: "Overview", icon: ActivityIcon },
          { id: "repositories", label: `Repositories (${repositories.length})`, icon: FolderGit2 },
          { id: "members", label: `Members (${members.length})`, icon: Users },
          { id: "discussions", label: `Discussions (${discussions.length})`, icon: MessageSquare },
          { id: "annotations", label: `Annotations (${annotations.length})`, icon: StickyNote },
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

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <WorkspaceOverviewTab
          workspace={workspace}
          repositories={repositories}
          members={members}
          activities={activities}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === "repositories" && (
        <WorkspaceRepositoriesTab
          workspaceId={workspace.id}
          repositories={repositories}
          canManage={canManage}
          onRefresh={fetchWorkspaceData}
          showToast={showToast}
        />
      )}

      {activeTab === "members" && (
        <WorkspaceMembersTab
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          members={members}
          invitations={invitations}
          currentUserRole={userRole}
          onRefresh={fetchWorkspaceData}
          showToast={showToast}
        />
      )}

      {activeTab === "discussions" && (
        <WorkspaceDiscussionsTab
          workspaceId={workspace.id}
          discussions={discussions}
          members={members}
          repositories={repositories}
          onRefresh={fetchWorkspaceData}
          showToast={showToast}
        />
      )}

      {activeTab === "annotations" && (
        <WorkspaceAnnotationsTab
          workspaceId={workspace.id}
          annotations={annotations}
          repositories={repositories}
          canManage={canManage}
          onRefresh={fetchWorkspaceData}
          showToast={showToast}
        />
      )}

      {activeTab === "settings" && (
        <WorkspaceSettingsTab
          workspace={workspace}
          members={members}
          onRefresh={() => {
            fetchWorkspaceData();
            refreshWorkspaces();
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
