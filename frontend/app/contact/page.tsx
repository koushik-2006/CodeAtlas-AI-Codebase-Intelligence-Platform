import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors py-10 px-5">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between pb-6 border-b border-[var(--border-color)]">
          <Link href="/"><Logo /></Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Contact CodeAtlas Team</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Have questions about enterprise deployment, GitHub permissions, or on-premise installation?
          </p>

          <div className="app-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[var(--primary)]" />
              <div>
                <span className="font-bold text-sm block">Engineering Support</span>
                <span className="font-mono text-xs text-[var(--text-secondary)]">support@codeatlas.dev</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-[var(--border-color)]">
              <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
              <div>
                <span className="font-bold text-sm block">GitHub Community</span>
                <span className="font-mono text-xs text-[var(--text-secondary)]">github.com/codeatlas/discussions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
