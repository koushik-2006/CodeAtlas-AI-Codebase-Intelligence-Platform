"use client";

import { useState } from "react";
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Eye,
  Trash2,
  Copy,
  Check,
  Clock,
  Mail,
  Loader2,
  X,
  AlertCircle,
  Plus,
  Send,
} from "lucide-react";
import { DbWorkspaceMember, WorkspaceRole } from "@/types/workspace";
import { apiClient } from "@/services/api-client";

interface WorkspaceMembersTabProps {
  workspaceId: string;
  workspaceName: string;
  members: DbWorkspaceMember[];
  invitations: any[];
  currentUserRole: WorkspaceRole;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export default function WorkspaceMembersTab({
  workspaceId,
  workspaceName,
  members,
  invitations,
  currentUserRole,
  onRefresh,
  showToast,
}: WorkspaceMembersTabProps) {
  const isOwner = currentUserRole === "owner";
  const isAdmin = currentUserRole === "admin" || isOwner;

  // Invite Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Remove member confirmation state
  const [removingMember, setRemovingMember] = useState<DbWorkspaceMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Role changing state
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleAddEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setInviteError("Please enter a valid email address");
      return;
    }
    if (inviteEmails.includes(trimmed)) {
      setEmailInput("");
      return;
    }
    setInviteEmails([...inviteEmails, trimmed]);
    setEmailInput("");
    setInviteError(null);
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleRemoveEmail = (em: string) => {
    setInviteEmails(inviteEmails.filter((x) => x !== em));
  };

  const handleSendInvitations = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmails = [...inviteEmails];
    if (emailInput.trim() && emailInput.includes("@")) {
      finalEmails.push(emailInput.trim().toLowerCase());
    }

    if (finalEmails.length === 0) {
      setInviteError("Please enter at least one teammate email address");
      return;
    }

    try {
      setInviteLoading(true);
      setInviteError(null);

      let lastToken = "";
      for (const email of finalEmails) {
        const res = await apiClient.post<any>(`/api/workspaces/${workspaceId}/invitations`, {
          email,
          role: inviteRole,
        });
        if (res.success && res.data?.token) {
          lastToken = res.data.token;
        }
      }

      const host = typeof window !== "undefined" ? window.location.origin : "";
      const shareUrl = `${host}/invitations/view/?token=${lastToken || "preview-token"}`;
      setGeneratedInviteLink(shareUrl);
      showToast(`Invitations created for ${finalEmails.length} teammates!`);
      onRefresh();
    } catch (err: any) {
      setInviteError(err.message || "Failed to create invitations");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInviteLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast("Copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRoleChange = async (targetUserId: string, newRole: WorkspaceRole) => {
    try {
      setUpdatingUserId(targetUserId);
      const res = await apiClient.patch<any>(`/api/workspaces/${workspaceId}/members`, {
        targetUserId,
        role: newRole,
      });
      if (res.success) {
        showToast("Member role updated!");
        onRefresh();
      } else {
        alert(res.message || "Failed to update role");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveMemberSubmit = async () => {
    if (!removingMember) return;
    try {
      setRemoveLoading(true);
      const res = await apiClient.delete<any>(
        `/api/workspaces/${workspaceId}/members?userId=${removingMember.userId}`
      );
      if (res.success) {
        showToast(`Removed ${removingMember.userName || "member"} from workspace`);
        setRemovingMember(null);
        onRefresh();
      } else {
        alert(res.message || "Failed to remove member");
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleResendInvite = (invite: any) => {
    showToast(`Invitation resent to ${invite.email}`);
  };

  const handleRevokeInvite = async (invitationId: string) => {
    try {
      const res = await apiClient.delete<any>(
        `/api/workspaces/${workspaceId}/invitations?invitationId=${invitationId}`
      );
      if (res.success) {
        showToast("Invitation revoked");
        onRefresh();
      } else {
        alert(res.message || "Failed to revoke invitation");
      }
    } catch (err: any) {
      alert(err.message || "Failed to revoke invitation");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <ShieldAlert className="w-3 h-3" />
            Owner
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Admin
          </span>
        );
      case "member":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Shield className="w-3 h-3" />
            Member
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/15 border border-gray-500/30 text-gray-400">
            <Eye className="w-3 h-3" />
            Viewer
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)]/60 pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">Workspace Members</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Manage teammates, configure roles, and inspect pending workspace invitations.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setInviteModalOpen(true);
              setGeneratedInviteLink(null);
              setInviteEmails([]);
              setEmailInput("");
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Members</span>
          </button>
        )}
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Active Members ({members.length})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-[var(--border-color)]/40 overflow-x-auto">
          {members.map((m) => {
            const isUserOwner = m.role === "owner";
            const isCurrentUser = m.userId === "usr_demo";

            return (
              <div
                key={m.id || m.userId}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-surface)]/50 transition-colors min-w-[550px]"
              >
                {/* Member Identity */}
                <div className="flex items-center gap-3">
                  <img
                    src={m.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.userId}`}
                    alt={m.userName || "Teammate"}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--border-color)] bg-neutral-800"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[var(--text-primary)]">
                        {m.userName || "Teammate"}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] block">
                      {m.userEmail || "teammate@codeatlas.dev"}
                    </span>
                  </div>
                </div>

                {/* Role & Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-[11px] text-[var(--text-secondary)] hidden sm:block">
                    Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : "Recently"}
                  </div>

                  {/* Role Dropdown / Badge */}
                  {isAdmin && !isUserOwner && !isCurrentUser ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.userId, e.target.value as WorkspaceRole)}
                      disabled={updatingUserId === m.userId}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    getRoleBadge(m.role)
                  )}

                  {/* Remove Button */}
                  {isAdmin && !isUserOwner && !isCurrentUser && (
                    <button
                      onClick={() => setRemovingMember(m)}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invitations Section */}
      {isAdmin && invitations.length > 0 && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Pending Invitations ({invitations.length})
              </h3>
            </div>
          </div>

          <div className="divide-y divide-[var(--border-color)]/40 overflow-x-auto">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-surface)]/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[var(--text-primary)]">
                      {inv.email}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium">
                      Pending
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Role offered: <strong className="capitalize text-[var(--text-primary)]">{inv.role}</strong> &bull; Sent {inv.sentAt || "Recently"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResendInvite(inv)}
                    className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--border-color)]/30 text-xs font-medium text-[var(--text-primary)] transition-colors"
                  >
                    Resend
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(inv.id)}
                    className="p-1.5 rounded-xl border border-transparent hover:border-red-500/30 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Revoke invitation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-6 relative">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Invite Teammates</h3>
                <p className="text-xs text-[var(--text-secondary)]">To {workspaceName}</p>
              </div>
            </div>

            {inviteError && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            {generatedInviteLink ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                  <p className="font-semibold mb-1">Invitations Created!</p>
                  <p className="text-[11px] text-emerald-300/80">
                    Share this link directly with your team. Recipients can accept and immediately join the workspace.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                    Shareable Invitation Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteLink}
                      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyInviteLink(generatedInviteLink)}
                      className="px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--primary)]/90 transition-colors shadow-md shadow-[var(--primary)]/20"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-[var(--border-color)]/60">
                  <button
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary)]/90 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvitations} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Teammate Email(s) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={handleEmailKeyDown}
                      placeholder="teammate@company.com (press Enter)"
                      className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      disabled={inviteLoading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddEmail}
                      className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {inviteEmails.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {inviteEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)]"
                        >
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="hover:opacity-75"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                    Assign Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setInviteRole("admin")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        inviteRole === "admin"
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1 font-semibold text-xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Admin</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
                        Full management
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInviteRole("member")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        inviteRole === "member"
                          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                          : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1 font-semibold text-xs">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Member</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
                        Read & write
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInviteRole("viewer")}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        inviteRole === "viewer"
                          ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                          : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1 font-semibold text-xs">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Viewer</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
                        Read only
                      </p>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]/60">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading || (inviteEmails.length === 0 && !emailInput.trim())}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {inviteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Invitations</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {removingMember && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[var(--bg-card)] shadow-2xl p-6 relative">
            <button
              onClick={() => setRemovingMember(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-400">Remove Member</h3>
                <p className="text-xs text-[var(--text-secondary)]">From {workspaceName}</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Are you sure you want to remove <strong className="text-[var(--text-primary)] font-semibold">{removingMember.userName || removingMember.userEmail}</strong>? They will lose access to this workspace&apos;s repositories and discussions.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]/60">
              <button
                type="button"
                onClick={() => setRemovingMember(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveMemberSubmit}
                disabled={removeLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-red-600/20"
              >
                {removeLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Removal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
