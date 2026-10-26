"use client";

import { useState } from "react";
import { X, UserPlus, Loader2, Copy, Check, AlertCircle, ShieldCheck, Shield, Eye } from "lucide-react";

interface InviteMemberModalProps {
  isOpen: boolean;
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteMemberModal({
  isOpen,
  workspaceId,
  workspaceName,
  onClose,
  onSuccess,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<{
    email: string;
    role: string;
    inviteLink: string;
    deliveryNote: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to invite teammate");
      }

      setCreatedInvite({
        email: json.data.email,
        role: json.data.role,
        inviteLink: json.data.inviteLink,
        deliveryNote: json.data.deliveryNote,
      });
      onSuccess();
    } catch (err: any) {
      console.error("Invite teammate error:", err);
      setError(err.message || "Failed to invite teammate");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdInvite?.inviteLink) return;
    navigator.clipboard.writeText(createdInvite.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Invite to {workspaceName}</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Send an invitation link to collaborate on this workspace.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {createdInvite ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
              <p className="font-semibold mb-1">Invitation Created Successfully!</p>
              <p className="text-[11px] text-emerald-300/80">
                An invitation for <strong>{createdInvite.email}</strong> as <strong>{createdInvite.role}</strong> has been generated (expires in 7 days).
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
                  value={createdInvite.inviteLink}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] font-mono select-all focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[var(--primary)]/90 transition-colors shadow-md shadow-[var(--primary)]/20"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 italic">
                {createdInvite.deliveryNote}
              </p>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[var(--border-color)]/60">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary)]/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                Teammate Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                Workspace Role *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === "admin"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-semibold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
                    Manage repos, invites & settings
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("member")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === "member"
                      ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                      : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-semibold text-xs">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Member</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
                    Explore code, artifacts & reviews
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("viewer")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === "viewer"
                      ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                      : "border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 font-semibold text-xs">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Viewer</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-tight">
                    Read-only access to repos
                  </p>
                </button>
              </div>
            </div>

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
                disabled={loading || !email.trim()}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-medium transition-all shadow-md shadow-[var(--primary)]/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Send Invitation</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
