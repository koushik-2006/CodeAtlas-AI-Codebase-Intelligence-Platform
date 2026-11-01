"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Building2,
  Users,
  FolderGit2,
  Shield,
  Sparkles,
  Save,
  Check,
  Trash2,
  LogOut,
  AlertTriangle,
  Loader2,
  UserCheck,
} from "lucide-react";
import { DbWorkspace, DbWorkspaceMember, WorkspaceRole } from "@/types/workspace";
import { apiClient } from "@/services/api-client";

interface WorkspaceSettingsTabProps {
  workspace: DbWorkspace & { userRole: WorkspaceRole };
  members: DbWorkspaceMember[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

const AVAILABLE_COLORS = [
  { name: "Purple", hex: "#7C5CFC" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Cyan", hex: "#06B6D4" },
];

const AVAILABLE_ICONS = [
  { id: "Building2", label: "Building", Icon: Building2 },
  { id: "Users", label: "Team", Icon: Users },
  { id: "FolderGit2", label: "Repo", Icon: FolderGit2 },
  { id: "Shield", label: "Security", Icon: Shield },
  { id: "Sparkles", label: "AI", Icon: Sparkles },
];

export default function WorkspaceSettingsTab({
  workspace,
  members,
  onRefresh,
  showToast,
}: WorkspaceSettingsTabProps) {
  const router = useRouter();
  const isOwner = workspace.userRole === "owner";
  const isAdmin = workspace.userRole === "admin" || isOwner;

  // Form State
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");
  const [color, setColor] = useState(workspace.color || "#7C5CFC");
  const [icon, setIcon] = useState(workspace.icon || "Building2");

  // Policies State
  const [aiReviewOnPR, setAiReviewOnPR] = useState(
    (workspace.settings as any)?.aiReviewOnPR ?? true
  );
  const [allowMemberInvites, setAllowMemberInvites] = useState(
    workspace.settings?.allowMemberInvites ?? true
  );
  const [requireReason, setRequireReason] = useState(
    workspace.settings?.requireReviewDismissalReason ?? true
  );
  const [defaultBranch, setDefaultBranch] = useState(
    (workspace.settings as any)?.defaultBranch || "main"
  );

  const [savingSettings, setSavingSettings] = useState(false);

  // Transfer Ownership
  const [transferUserId, setTransferUserId] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  // Delete / Leave
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSavingSettings(true);
      const res = await apiClient.patch<any>(`/api/workspaces/${workspace.id}`, {
        name: name.trim(),
        description: description.trim(),
        color,
        icon,
        settings: {
          allowMemberInvites,
          requireReviewDismissalReason: requireReason,
          aiReviewOnPR,
          defaultBranch,
        },
      });

      if (res.success) {
        showToast("Workspace settings saved!");
        onRefresh();
      } else {
        alert(res.message || "Failed to save settings");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferUserId) {
      alert("Please select a teammate to transfer ownership to.");
      return;
    }
    const target = members.find((m) => m.userId === transferUserId);
    if (!confirm(`Are you sure you want to transfer workspace ownership to ${target?.userName || "this user"}? You will become an Admin.`)) {
      return;
    }

    try {
      setTransferLoading(true);
      const res = await apiClient.patch<any>(`/api/workspaces/${workspace.id}/members`, {
        targetUserId: transferUserId,
        role: "owner",
      });
      if (res.success) {
        showToast("Ownership transferred successfully!");
        onRefresh();
      } else {
        alert(res.message || "Failed to transfer ownership");
      }
    } catch (err: any) {
      alert(err.message || "Failed to transfer ownership");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!confirm(`Are you sure you want to leave ${workspace.name}?`)) return;
    try {
      const res = await apiClient.delete<any>(
        `/api/workspaces/${workspace.id}/members?userId=usr_demo`
      );
      if (res.success) {
        showToast(`You left ${workspace.name}`);
        router.push("/workspaces");
      } else {
        alert(res.message || "Failed to leave workspace");
      }
    } catch (err: any) {
      alert(err.message || "Failed to leave workspace");
    }
  };

  const handleDeleteWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText.trim() !== workspace.name) {
      alert("Please type the exact workspace name to confirm deletion");
      return;
    }

    try {
      setDeleteLoading(true);
      const res = await apiClient.delete<any>(`/api/workspaces/${workspace.id}`);
      if (res.success) {
        showToast(`Workspace "${workspace.name}" permanently deleted`);
        router.push("/workspaces");
      } else {
        alert(res.message || "Failed to delete workspace");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete workspace");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-200">
      {/* Workspace Profile Card */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
          Workspace Profile
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mb-5">
          General settings, appearance, and branding for this workspace.
        </p>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Workspace Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Workspace Slug
              </label>
              <input
                type="text"
                value={workspace.slug}
                disabled
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-mono text-[var(--text-secondary)] opacity-60 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isAdmin}
              rows={2}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none disabled:opacity-60"
            />
          </div>

          {/* Color & Icon Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                {AVAILABLE_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => isAdmin && setColor(col.hex)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {color === col.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                Icon
              </label>
              <div className="flex items-center gap-2">
                {AVAILABLE_ICONS.map((item) => {
                  const IconComp = item.Icon;
                  const isSelected = icon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => isAdmin && setIcon(item.id)}
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                          : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                      title={item.label}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Policies Section */}
          <div className="pt-4 border-t border-[var(--border-color)]/60 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Workspace Policies & Governance
            </h4>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={aiReviewOnPR}
                onChange={(e) => setAiReviewOnPR(e.target.checked)}
                disabled={!isAdmin}
                className="mt-0.5 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <div>
                <span className="text-xs font-semibold text-[var(--text-primary)] block">
                  Automated AI Code Review on New PRs
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Runs static analysis and AST checks when new pull requests are opened.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowMemberInvites}
                onChange={(e) => setAllowMemberInvites(e.target.checked)}
                disabled={!isAdmin}
                className="mt-0.5 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <div>
                <span className="text-xs font-semibold text-[var(--text-primary)] block">
                  Allow Member Invitations
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Teammates with Member role can invite other collaborators.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requireReason}
                onChange={(e) => setRequireReason(e.target.checked)}
                disabled={!isAdmin}
                className="mt-0.5 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <div>
                <span className="text-xs font-semibold text-[var(--text-primary)] block">
                  Require Dismissal Audit Reason
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Developers must provide a written reason before dismissing code review security warnings.
                </span>
              </div>
            </label>

            <div className="pt-2 max-w-xs">
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Default Branch
              </label>
              <input
                type="text"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                disabled={!isAdmin}
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-end pt-3 border-t border-[var(--border-color)]/60">
              <button
                type="submit"
                disabled={savingSettings || !name.trim()}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Save className="w-3.5 h-3.5" />
                <span>Save Settings</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Transfer Ownership Card */}
      {isOwner && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Transfer Ownership</h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Transfer full ownership of this workspace to another teammate. You will retain Admin permissions.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={transferUserId}
              onChange={(e) => setTransferUserId(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">Select a teammate...</option>
              {members
                .filter((m) => m.userId !== "usr_demo")
                .map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userName} ({m.userEmail}) - {m.role}
                  </option>
                ))}
            </select>

            <button
              onClick={handleTransferOwnership}
              disabled={transferLoading || !transferUserId}
              className="px-4 py-2 rounded-xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold transition-all disabled:opacity-50"
            >
              {transferLoading ? "Transferring..." : "Transfer Ownership"}
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-5">
          Irreversible actions that affect your workspace membership or permanently delete data.
        </p>

        <div className="space-y-4">
          {!isOwner && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div>
                <h4 className="text-xs font-bold text-amber-300">Leave Workspace</h4>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Revoke your own access to this workspace.
                </p>
              </div>
              <button
                onClick={handleLeaveWorkspace}
                className="px-3.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave</span>
              </button>
            </div>
          )}

          {isOwner && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-red-400">Delete This Workspace</h4>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Permanently delete this workspace, including its discussions, member list, and notes. Type <strong className="text-[var(--text-primary)] font-mono">{workspace.name}</strong> to confirm:
                </p>
              </div>

              <form onSubmit={handleDeleteWorkspace} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={workspace.name}
                  className="flex-1 rounded-xl border border-red-500/40 bg-[var(--bg-surface)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirmText.trim() !== workspace.name}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20"
                >
                  {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Workspace</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
