"use client";

import { useState, useEffect } from "react";
import {
  X,
  Building2,
  Users,
  FolderGit2,
  Shield,
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
  Plus,
} from "lucide-react";
import { apiClient } from "@/services/api-client";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workspace: any) => void;
  existingWorkspaces?: { name: string; slug: string }[];
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

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSuccess,
  existingWorkspaces = [],
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPersonal, setIsPersonal] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#7C5CFC");
  const [selectedIcon, setSelectedIcon] = useState("Building2");

  // Repository selection
  const [allRepos, setAllRepos] = useState<any[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);

  // Email chips
  const [emailInput, setEmailInput] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);

  // Settings
  const [allowMemberInvites, setAllowMemberInvites] = useState(true);
  const [requireReviewDismissalReason, setRequireReviewDismissalReason] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Load repositories for multi-select
    apiClient
      .get<any>("/api/repositories")
      .then((res) => {
        const repos = res.data?.repositories || res.data || [];
        if (Array.isArray(repos)) {
          setAllRepos(repos);
          if (repos.length > 0 && selectedRepoIds.length === 0) {
            // Default select the first repository
            setSelectedRepoIds([repos[0].id]);
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(autoSlug);
  };

  const handleAddEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }
    if (inviteEmails.includes(trimmed)) {
      setEmailInput("");
      return;
    }
    setInviteEmails([...inviteEmails, trimmed]);
    setEmailInput("");
    setError(null);
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleRemoveEmail = (target: string) => {
    setInviteEmails(inviteEmails.filter((em) => em !== target));
  };

  const toggleRepo = (repoId: string) => {
    if (selectedRepoIds.includes(repoId)) {
      setSelectedRepoIds(selectedRepoIds.filter((id) => id !== repoId));
    } else {
      setSelectedRepoIds([...selectedRepoIds, repoId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a workspace name");
      return;
    }

    const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const slugConflict = existingWorkspaces.some(
      (w) => w.slug.toLowerCase() === finalSlug.toLowerCase()
    );
    if (slugConflict) {
      setError(`A workspace with the slug "/${finalSlug}" already exists. Please choose another.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await apiClient.post<any>("/api/workspaces", {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        isPersonal,
        color: selectedColor,
        icon: selectedIcon,
        repositoryIds: selectedRepoIds,
        invitedEmails: inviteEmails,
        settings: {
          allowMemberInvites,
          requireReviewDismissalReason,
        },
      });

      const json = res.data || {};
      if (!res.success) {
        throw new Error(json.error || res.message || "Failed to create workspace");
      }

      const created = json.workspace || json.data || json;
      onSuccess(created);
    } catch (err: any) {
      console.error("Create workspace error:", err);
      setError(err.message || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-workspace-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="w-full max-w-xl rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-6 relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center text-white"
            style={{ backgroundColor: selectedColor, borderColor: `${selectedColor}80` }}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 id="create-workspace-title" className="text-base font-bold text-[var(--text-primary)]">
              Create Team Workspace
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Organize repositories, invite teammates, and collaborate with AI code review.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Workspace Name & Auto Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Workspace Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Platform Core, Mobile Team"
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Workspace Slug *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)]/70 font-mono">
                  /
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}
                  placeholder="platform-core"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] pl-6 pr-3 py-2 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shared repository intelligence and architecture mapping for our core infrastructure."
              rows={2}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              disabled={loading}
            />
          </div>

          {/* Type Toggle: Team vs Personal */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
              Workspace Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPersonal(false)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  !isPersonal
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Team Workspace</div>
                  <div className="text-[10px] opacity-80">Share with colleagues and assign roles</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPersonal(true)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  isPersonal
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Personal Workspace</div>
                  <div className="text-[10px] opacity-80">Private playground for solo exploration</div>
                </div>
              </button>
            </div>
          </div>

          {/* Color & Icon Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Color Swatches */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                {AVAILABLE_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setSelectedColor(col.hex)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative"
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {selectedColor === col.hex && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                Icon
              </label>
              <div className="flex items-center gap-2">
                {AVAILABLE_ICONS.map((item) => {
                  const IconComp = item.Icon;
                  const isSelected = selectedIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIcon(item.id)}
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

          {/* Multi-Select Repositories */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Select Repositories ({selectedRepoIds.length} selected)
            </label>
            <div className="max-h-28 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-2 space-y-1">
              {allRepos.length === 0 ? (
                <div className="text-xs text-[var(--text-secondary)] p-2 text-center">
                  Loading repositories...
                </div>
              ) : (
                allRepos.map((r) => {
                  const checked = selectedRepoIds.includes(r.id);
                  return (
                    <label
                      key={r.id}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[var(--bg-card)] cursor-pointer text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRepo(r.id)}
                          className="rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        <span className="font-medium text-[var(--text-primary)]">{r.name}</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">({r.language})</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                        {r.starsCount ? `★ ${r.starsCount}` : ""}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Invite Teammates (Email Chips) */}
          {!isPersonal && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Invite Teammates by Email
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  placeholder="teammate@company.com (press Enter to add)"
                  className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {inviteEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {inviteEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)]"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="hover:opacity-75"
                        aria-label={`Remove ${email}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Policy Checkboxes */}
          <div className="space-y-2 pt-1 border-t border-[var(--border-color)]/50">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowMemberInvites}
                onChange={(e) => setAllowMemberInvites(e.target.checked)}
                className="mt-0.5 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
                disabled={loading}
              />
              <span className="text-xs text-[var(--text-secondary)]">
                Allow workspace members and admins to invite teammates
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requireReviewDismissalReason}
                onChange={(e) => setRequireReviewDismissalReason(e.target.checked)}
                className="mt-0.5 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
                disabled={loading}
              />
              <span className="text-xs text-[var(--text-secondary)]">
                Require audit reason when teammates dismiss review findings
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold transition-all shadow-md shadow-[var(--primary)]/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
