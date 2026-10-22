import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, BookOpen, Mail, FileText } from "lucide-react";

export default function TermsPage() {
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
          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
          <div className="app-card p-6 space-y-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Permitted Usage</h2>
            <p>CodeAtlas provides developer intelligence tools for understanding software systems. You retain all intellectual property and copyright rights over code inspected through the platform.</p>
            <h2 className="text-base font-bold text-[var(--text-primary)] pt-2">Repository Authorization</h2>
            <p>Users must have legal authorization to analyze private codebases imported through GitHub OAuth or uploaded archive files.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
