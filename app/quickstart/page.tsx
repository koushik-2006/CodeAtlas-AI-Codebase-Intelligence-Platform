"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import {
  Terminal,
  Copy,
  Check,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FolderTree,
  Cpu,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export default function QuickstartPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const steps = [
    {
      id: "reqs",
      title: "1. Prerequisites & System Requirements",
      description: "Ensure you have the required Node.js runtime and npm package manager installed on your machine.",
      command: "node -v # Requires Node.js >= 18.17.0 (Recommended: Node.js 20.x LTS)\nnpm -v  # Requires npm >= 9.x",
    },
    {
      id: "clone",
      title: "2. Clone Repository & Install Dependencies",
      description: "Install project dependencies using the existing package lockfile.",
      command: "git clone https://github.com/your-org/codeatlas.git\ncd codeatlas\nnpm install",
    },
    {
      id: "env",
      title: "3. Configure Environment Variables",
      description: "Copy the provided example environment template. CodeAtlas is fully operational locally without external API keys via local deterministic AST parsing.",
      command: "cp .env.example .env.local\n\n# Optional: Add OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY for live LLM responses\n# Optional: Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET for GitHub OAuth",
    },
    {
      id: "db",
      title: "4. Database Initialization",
      description: "CodeAtlas uses an isolated JSON document store at data/codeatlas-db.json with automatic schema migrations. No external Postgres, MySQL, or Redis daemon is required for local development.",
      command: "ls data/codeatlas-db.json\n# Database initializes automatically on first server boot if missing",
    },
    {
      id: "dev",
      title: "5. Start Development Server",
      description: "Launch the Next.js unified full-stack application (frontend + API routes).",
      command: "npm run dev\n# App listens at http://localhost:3000\n# Health check available at http://localhost:3000/api/health",
    },
    {
      id: "test",
      title: "6. Run Automated Test Verification",
      description: "Execute the complete test suite including security unit tests, integration tests, E2E user journeys, and Phase 12 intelligence tests.",
      command: "npm run test\n\n# Run complete quality gate (Lint + Typecheck + Unit + Integration + E2E + Phase 12 + Build):\nnpm run test:all",
    },
    {
      id: "build",
      title: "7. Production Build & Deployment",
      description: "Create an optimized production build and start the production runtime.",
      command: "npm run build\nnpm run start",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors py-10 px-5">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-[var(--border-color)]">
          <Link href="/" aria-label="CodeAtlas Home">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/docs"
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Full Documentation</span>
            </Link>
          </div>
        </header>

        {/* Hero Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1 font-mono text-xs font-bold text-[var(--primary)] border border-[var(--primary)]/20">
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer Quickstart • 5-Minute Setup</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Run CodeAtlas on Your Local Machine
          </h1>
          <p className="text-base text-[var(--text-secondary)] max-w-2xl">
            Get CodeAtlas running in minutes with zero external cloud dependencies. Explore the bundled sample project or connect your own GitHub repositories.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className="p-6 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-3"
            >
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                {step.title}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {step.description}
              </p>

              <div className="relative group">
                <pre className="p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed">
                  {step.command}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(step.command, step.id)}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-all shadow-sm"
                  aria-label="Copy snippet"
                >
                  {copiedId === step.id ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Verification Summary Box */}
        <div className="p-6 rounded-3xl border border-green-500/30 bg-green-500/5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Verified Out-of-the-Box Capabilities</span>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] font-mono">
            <li>✔ Full AST call trees & symbol resolution</li>
            <li>✔ Interactive Architecture Knowledge Graph</li>
            <li>✔ Pre-indexed sample-project repository</li>
            <li>✔ Change Impact analysis & risk scoring</li>
            <li>✔ Offline deterministic AI synthesis fallback</li>
            <li>✔ Dual light & dark theme design system</li>
          </ul>
        </div>

        {/* Bottom CTA */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--border-color)]">
          <Link
            href="/demo"
            className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1.5"
          >
            <span>Explore Standalone Demo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs transition-all shadow-sm ${
              isDark
                ? "bg-[#29D3C2] text-[#0E1116] hover:bg-[#22b5a6]"
                : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
            }`}
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
