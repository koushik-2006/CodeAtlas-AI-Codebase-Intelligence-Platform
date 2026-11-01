"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspaces, WorkspaceItem } from "@/hooks/useWorkspaces";
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
  Clock,
  MoreVertical,
  Copy,
  Trash2,
  Edit2,
  LogOut,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import CreateWorkspaceModal from "@/components/workspace/CreateWorkspaceModal";
import { apiClient } from "@/services/api-client";

type FilterType = "all" | "team" | "personal";
type SortType = "recently-active" | "name" | "repos";

export default function WorkspacesPage() {
  const router = useRouter();
  const { workspaces, activeWorkspace, setActiveWorkspaceId, loading, refreshWorkspaces } =
    useWorkspaces();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortType, setSortType] = useState<SortType>("recently-active");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Card Menu / Modal state
  const [activeMenuWsId, setActiveMenuWsId] = useState<string | null>(null);
  const [renameWs, setRenameWs] = useState<WorkspaceItem | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);

  const [deleteWs, setDeleteWs] = useState<WorkspaceItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Filter & Sort
  const processedWorkspaces = useMemo(() => {
    let list = workspaces.filter((w) => {
      const matchSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.slug.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (filterType === "team") return !w.isPersonal;
      if (filterType === "personal") return w.isPersonal;
      return true;
    });

    list.sort((a, b) => {
      if (sortType === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortType === "repos") {
        return (b.repoCount || 0) - (a.repoCount || 0);
      }
      // recently-active: sort by updatedAt or createdAt
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return list;
  }, [workspaces, searchQuery, filterType, sortType]);

  const teamWorkspaces = useMemo(
    () => processedWorkspaces.filter((w) => !w.isPersonal),
    [processedWorkspaces]
  );
  const personalWorkspaces = useMemo(
    () => processedWorkspaces.filter((w) => w.isPersonal),
    [processedWorkspaces]
  );

  const handleSwitchWorkspace = (id: string, name: string) => {
    setActiveWorkspaceId(id);
    showToast(`Switched active workspace to "${name}"`);
  };

  const handleDuplicate = async (ws: WorkspaceItem) => {
    try {
      setActiveMenuWsId(null);
      const res = await apiClient.post<any>(`/api/workspaces/${ws.id}/duplicate`);
      if (res.success) {
        showToast(`Workspace "${ws.name}" duplicated successfully!`);
        refreshWorkspaces();
      } else {
        alert(res.message || "Failed to duplicate workspace");
      }
    } catch (err: any) {
      alert(err.message || "Failed to duplicate workspace");
    }
  };

  const handleLeave = async (ws: WorkspaceItem) => {
    if (!confirm(`Are you sure you want to leave workspace "${ws.name}"?`)) return;
    try {
      setActiveMenuWsId(null);
      const res = await apiClient.delete<any>(
        `/api/workspaces/${ws.id}/members?userId=usr_demo`
      );
      if (res.success) {
        showToast(`You left "${ws.name}"`);
        refreshWorkspaces();
      } else {
        alert(res.message || "Failed to leave workspace");
      }
    } catch (err: any) {
      alert(err.message || "Failed to leave workspace");
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameWs || !renameName.trim()) return;
    try {
      setRenameLoading(true);
      const res = await apiClient.patch<any>(`/api/workspaces/${renameWs.id}`, {
        name: renameName.trim(),
        slug: renameName.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      });
      if (res.success) {
        showToast(`Workspace renamed to "${renameName.trim()}"`);
        setRenameWs(null);
        refreshWorkspaces();
      } else {
        alert(res.message || "Failed to rename workspace");
      }
    } catch (err: any) {
      alert(err.message || "Failed to rename workspace");
    } finally {
      setRenameLoading(false);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteWs) return;
    if (deleteConfirmText.trim() !== deleteWs.name) {
      alert("Please type the exact workspace name to confirm.");
      return;
    }
    try {
      setDeleteLoading(true);
      const res = await apiClient.delete<any>(`/api/workspaces/${deleteWs.id}`);
      if (res.success) {
        showToast(`Workspace "${deleteWs.name}" was permanently deleted.`);
        setDeleteWs(null);
        refreshWorkspaces();
      } else {
        alert(res.message || "Failed to delete workspace");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete workspace");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
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

  const renderWorkspaceIcon = (ws: WorkspaceItem) => {
    const color = ws.color || (ws.isPersonal ? "#10B981" : "#7C5CFC");
    const iconName = ws.icon || (ws.isPersonal ? "User" : "Building2");

    let IconComp = Building2;
    if (iconName === "Users") IconComp = Users;
    else if (iconName === "FolderGit2") IconComp = FolderGit2;
    else if (iconName === "Shield") IconComp = Shield;
    else if (iconName === "Sparkles") IconComp = Sparkles;
    else if (iconName === "User" || ws.isPersonal) IconComp = User;

    return (
      <div
        className="w-10 h-10 rounded-xl border flex items-center justify-center text-white shadow-sm flex-shrink-0"
        style={{
          backgroundColor: color,
          borderColor: `${color}88`,
        }}
      >
        <IconComp className="w-5 h-5" />
      </div>
    );
  };

  const renderCard = (ws: WorkspaceItem) => {
    const isActive = ws.id === activeWorkspace?.id;
    const isOwner = ws.userRole === "owner";
    const membersList = (ws as any).members || [];

    return (
      <div
        key={ws.id}
        className={`rounded-2xl border p-5 transition-all flex flex-col justify-between relative group ${
          isActive
            ? "border-[var(--primary)] bg-[var(--bg-card)] shadow-lg shadow-[var(--primary)]/10 ring-1 ring-[var(--primary)]/50"
            : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-color)]/90"
        }`}
      >
        <div>
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {renderWorkspaceIcon(ws)}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                    {ws.name}
                  </h3>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary)]/15 border border-[var(--primary)]/40 text-[var(--primary)]">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      Active
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                  /{ws.slug}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 relative">
              {getRoleBadge(ws.userRole)}

              {/* ⋯ Card Menu */}
              <button
                type="button"
                onClick={() =>
                  setActiveMenuWsId(activeMenuWsId === ws.id ? null : ws.id)
                }
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
                aria-label="Workspace options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {activeMenuWsId === ws.id && (
                <div
                  className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setActiveMenuWsId(null)}
                >
                  <button
                    onClick={() => {
                      setActiveMenuWsId(null);
                      setRenameWs(ws);
                      setRenameName(ws.name);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] rounded-lg text-left transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Rename</span>
                  </button>

                  <button
                    onClick={() => handleDuplicate(ws)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)] rounded-lg text-left transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>

                  {!isOwner && (
                    <button
                      onClick={() => handleLeave(ws)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10 rounded-lg text-left transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Leave</span>
                    </button>
                  )}

                  {isOwner && (
                    <button
                      onClick={() => {
                        setActiveMenuWsId(null);
                        setDeleteWs(ws);
                        setDeleteConfirmText("");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg text-left transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed min-h-[2rem]">
            {ws.description || "Shared workspace for team collaboration and repository insights."}
          </p>

          {/* Metadata bar */}
          <div className="flex items-center justify-between gap-2 py-2 border-y border-[var(--border-color)]/40 mb-4 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5" title="Repositories">
                <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {ws.repoCount} {ws.repoCount === 1 ? "repo" : "repos"}
                </span>
              </div>

              {/* Stacked Member Avatars */}
              {!ws.isPersonal && (
                <div className="flex items-center">
                  <div className="flex -space-x-2 overflow-hidden items-center mr-1.5">
                    {membersList.slice(0, 3).map((m: any, idx: number) => (
                      <img
                        key={m.userId || idx}
                        src={m.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.userId || idx}`}
                        alt={m.userName || "Member"}
                        className="inline-block h-5 w-5 rounded-full ring-2 ring-[var(--bg-card)] object-cover bg-neutral-800"
                        title={m.userName || m.userEmail}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {ws.memberCount} {ws.memberCount === 1 ? "member" : "members"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]/80">
              <Clock className="w-3 h-3" />
              <span>Active recently</span>
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={() => handleSwitchWorkspace(ws.id, ws.name)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? "bg-[var(--primary)]/15 text-[var(--primary)] cursor-default border border-[var(--primary)]/30"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 border border-transparent"
            }`}
          >
            {isActive ? "Active Workspace" : "Switch To"}
          </button>

          <Link
            href={`/workspaces/${ws.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-semibold transition-colors"
          >
            <span>Open</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

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

      {/* Search, Filter Chips, and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces by name or description..."
            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips & Sort Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Filter Chips */}
          <div className="flex items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-1">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === "all"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("team")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === "team"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Team
            </button>
            <button
              onClick={() => setFilterType("personal")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterType === "personal"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Personal
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as SortType)}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
          >
            <option value="recently-active">Sort: Recently Active</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="repos">Sort: Most Repos</option>
          </select>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && workspaces.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-48 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/40 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State - Search Miss */}
      {!loading && processedWorkspaces.length === 0 && searchQuery && (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-10 text-center bg-[var(--bg-card)]/40">
          <Search className="w-10 h-10 text-[var(--text-secondary)]/60 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            No workspaces match &quot;{searchQuery}&quot;
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
            Try adjusting your search terms or filter criteria.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-color)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
          >
            <span>Clear search</span>
          </button>
        </div>
      )}

      {/* Empty State - No Workspaces At All */}
      {!loading && workspaces.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-10 text-center bg-[var(--bg-card)]/40">
          <Building2 className="w-12 h-12 text-[var(--text-secondary)]/60 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            No workspaces found
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mb-5">
            Create your first workspace to organize your code repositories, generate architecture blueprints, and collaborate with your engineering team.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workspace</span>
          </button>
        </div>
      )}

      {/* Team Workspaces Section */}
      {filterType !== "personal" && teamWorkspaces.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--primary)]" />
              <span>Team Workspaces ({teamWorkspaces.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamWorkspaces.map(renderCard)}
          </div>
        </div>
      )}

      {/* Personal Workspaces Section */}
      {filterType !== "team" && personalWorkspaces.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Personal Workspaces ({personalWorkspaces.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalWorkspaces.map(renderCard)}
          </div>
        </div>
      )}

      {/* Create Workspace Modal */}
      {createModalOpen && (
        <CreateWorkspaceModal
          isOpen={createModalOpen}
          existingWorkspaces={workspaces.map((w) => ({ name: w.name, slug: w.slug }))}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={(created) => {
            setCreateModalOpen(false);
            refreshWorkspaces();
            showToast(`Workspace "${created?.name || "New Workspace"}" created!`);
            if (created?.id) {
              setActiveWorkspaceId(created.id);
              router.push(`/workspaces/${created.id}`);
            }
          }}
        />
      )}

      {/* Rename Workspace Modal */}
      {renameWs && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-6 relative">
            <button
              onClick={() => setRenameWs(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              Rename Workspace
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Update the display name of &quot;{renameWs.name}&quot;.
            </p>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  autoFocus
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]/60">
                <button
                  type="button"
                  onClick={() => setRenameWs(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renameLoading || !renameName.trim()}
                  className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary)]/90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {renameLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteWs && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[var(--bg-card)] shadow-2xl p-6 relative">
            <button
              onClick={() => setDeleteWs(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-400">
                  Delete Workspace
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              All member associations, discussions, and workspace configurations will be permanently removed. To confirm, please type <strong className="text-[var(--text-primary)] font-mono">{deleteWs.name}</strong> below:
            </p>

            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteWs.name}
                className="w-full rounded-xl border border-red-500/40 bg-[var(--bg-surface)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]/60">
                <button
                  type="button"
                  onClick={() => setDeleteWs(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirmText.trim() !== deleteWs.name}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5 shadow-md shadow-red-600/20"
                >
                  {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Permanently Delete</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
