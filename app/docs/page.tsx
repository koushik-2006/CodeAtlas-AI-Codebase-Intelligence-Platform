import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, BookOpen, Terminal, Sparkles, Network } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors py-10 px-5">
      <div className="max-w-4xl mx-auto">
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
          <h1 className="text-3xl font-extrabold tracking-tight">CodeAtlas Documentation</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Explore guides on Visual CodeLens extraction, AST architecture graphs, and verified receipt citations.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/visual-code-explorer" className="app-card p-5 hover:-translate-y-1 transition-all">
              <Terminal className="w-6 h-6 text-[var(--primary)] mb-2" />
              <h3 className="font-bold text-sm">Visual Code Explorer</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Paste, upload, or photograph code to trace symbols.</p>
            </Link>
            <Link href="/architecture" className="app-card p-5 hover:-translate-y-1 transition-all">
              <Network className="w-6 h-6 text-[var(--primary)] mb-2" />
              <h3 className="font-bold text-sm">Architecture Graphs</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Interactive isometric city and node network call paths.</p>
            </Link>
            <Link href="/assistant" className="app-card p-5 hover:-translate-y-1 transition-all">
              <Sparkles className="w-6 h-6 text-[var(--primary)] mb-2" />
              <h3 className="font-bold text-sm">AI with Receipts</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Grounding answers with exact line numbers and citations.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
