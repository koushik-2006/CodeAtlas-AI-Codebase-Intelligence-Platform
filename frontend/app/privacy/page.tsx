import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
          <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xs uppercase tracking-wide">
            <Shield className="w-4 h-4" /> CodeAtlas Security Standard
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            At CodeAtlas, codebase confidentiality is our fundamental engineering principle.
          </p>

          <div className="app-card p-6 space-y-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            <h2 className="text-base font-bold text-[var(--text-primary)]">1. Zero Model Training</h2>
            <p>
              Your source code, AST trees, repository maps, and OCR screenshot uploads are never retained to train public or proprietary machine learning models.
            </p>

            <h2 className="text-base font-bold text-[var(--text-primary)] pt-2">2. Token Protection</h2>
            <p>
              OAuth tokens for GitHub access are granted strictly read-only repository metadata scopes and are securely handled with short-lived session lifetimes.
            </p>

            <h2 className="text-base font-bold text-[var(--text-primary)] pt-2">3. Deterministic AST Analysis</h2>
            <p>
              Source references and citations beside every AI response are grounded through static AST parsers and tree-sitter indices rather than speculative generation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
