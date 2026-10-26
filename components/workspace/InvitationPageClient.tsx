"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Shield,
  Eye,
} from "lucide-react";
import Logo from "@/components/Logo";

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvitation() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/invitations/${token}`);
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || "Invitation not found or has expired");
        }
        setInvitation(json.data);
      } catch (err: any) {
        setError(err.message || "Failed to load invitation");
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const handleAction = async (action: "accept" | "decline") => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to process invitation");
      }

      if (action === "accept") {
        setSuccessMessage(json.message || "Invitation accepted!");
        setTimeout(() => {
          router.push(`/workspaces/${json.data?.workspace?.id || ""}`);
        }, 1500);
      } else {
        router.push("/workspaces");
      }
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation");
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <Eye className="w-3.5 h-3.5" />
            Viewer
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2">
          <Logo size="md" />
        </Link>
        <Link
          href="/login"
          className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Main Card */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-[var(--primary)]" />
              <p className="text-xs text-[var(--text-secondary)]">Loading workspace invitation...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Invitation Unavailable</h2>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">{error}</p>
              <Link
                href="/workspaces"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary)]/90 transition-colors"
              >
                <span>Go to Workspaces</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : successMessage ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Welcome to the Team!</h2>
              <p className="text-xs text-emerald-400">{successMessage}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">Redirecting to your workspace...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] flex items-center justify-center mx-auto mb-3 shadow-md shadow-[var(--primary)]/10">
                  <Building2 className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                  You&apos;re invited to join
                </h1>
                <h2 className="text-lg font-extrabold text-[var(--primary)] mt-0.5">
                  {invitation.workspaceName}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  <strong>{invitation.invitedByName || "A teammate"}</strong> has invited you to collaborate on CodeAtlas.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-color)]/70 bg-[var(--bg-surface)]/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Invited Email:</span>
                  <span className="font-semibold text-[var(--text-primary)] font-mono">{invitation.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Assigned Role:</span>
                  <div>{getRoleBadge(invitation.role)}</div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Status:</span>
                  <span className="capitalize text-xs font-medium text-emerald-400">
                    {invitation.status}
                  </span>
                </div>
              </div>

              {invitation.isExpired ? (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs text-center">
                  This invitation has expired. Please ask the workspace owner to send a new invite.
                </div>
              ) : (
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => handleAction("accept")}
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold transition-all shadow-md shadow-[var(--primary)]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Accept Invitation & Join</span>
                  </button>

                  <button
                    onClick={() => handleAction("decline")}
                    disabled={submitting}
                    className="w-full py-2 rounded-xl border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/20 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-[11px] text-[var(--text-secondary)]/70">
        CodeAtlas AI Codebase Intelligence &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}
