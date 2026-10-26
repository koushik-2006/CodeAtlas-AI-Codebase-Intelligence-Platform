"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import {
  BookOpen,
  Terminal,
  Settings,
  Code2,
  ShieldCheck,
  AlertTriangle,
  Search,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Sparkles,
  GitFork,
  Network,
  GitCompare,
  GitPullRequest,
  Database,
  FileCode2,
} from "lucide-react";

type DocSectionId =
  | "getting-started"
  | "features"
  | "configuration"
  | "development"
  | "troubleshooting"
  | "security";

export default function DocumentationPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeSection, setActiveSection] = useState<DocSectionId>("getting-started");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sections = [
    { id: "getting-started" as DocSectionId, name: "Getting Started", icon: BookOpen },
    { id: "features" as DocSectionId, name: "Core Features", icon: Code2 },
    { id: "configuration" as DocSectionId, name: "Configuration", icon: Settings },
    { id: "development" as DocSectionId, name: "Local Development", icon: Terminal },
    { id: "troubleshooting" as DocSectionId, name: "Troubleshooting", icon: AlertTriangle },
    { id: "security" as DocSectionId, name: "Security & Privacy", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors py-6 sm:py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="CodeAtlas Home">
              <Logo size="md" />
            </Link>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 font-bold">
              Documentation v2.0
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <ThemeToggle />
            <Link
              href="/quickstart"
              className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Quickstart
            </Link>
            <Link
              href="/demo"
              className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Demo
            </Link>
            <Link
              href="/dashboard"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all shadow-sm ${
                isDark
                  ? "bg-[#29D3C2] text-[#0E1116] hover:bg-[#22b5a6]"
                  : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
              }`}
            >
              <span>App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Documentation Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Filter documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all font-mono"
              />
            </div>

            <nav className="space-y-1" aria-label="Documentation Sidebar">
              {sections
                .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((sec) => {
                  const Icon = sec.icon;
                  const isCurrent = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveSection(sec.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-[var(--primary)] text-white shadow-sm"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{sec.name}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  );
                })}
            </nav>

            <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs space-y-2">
              <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Local Setup in 5 Mins</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Prefer hands-on code? Jump directly to the developer quickstart guide.
              </p>
              <Link
                href="/quickstart"
                className="inline-flex items-center gap-1 text-[var(--primary)] font-bold text-[11px] hover:underline"
              >
                <span>Open Quickstart</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </aside>

          {/* Main Documentation Content Area */}
          <main className="lg:col-span-9 p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-10">
            {/* 1. GETTING STARTED */}
            {activeSection === "getting-started" && (
              <section className="space-y-6">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">Getting Started</h1>
                  <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    CodeAtlas is an AI-powered codebase intelligence platform designed to help developers explore unfamiliar repositories, navigate symbol hierarchies, trace multi-tier workflows, and review code changes with verifiable evidence.
                  </p>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-bold">1. System Prerequisites</h2>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    To run CodeAtlas locally, ensure you have Node.js 18.17.0+ or 20.x LTS installed with npm:
                  </p>
                  <pre className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)]">
                    node --version # v18.17.0 or v20.x required{"\n"}npm --version
                  </pre>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-bold">2. Connecting Your First Repository</h2>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    CodeAtlas includes a bundled <strong>sample-project</strong> out of the box with zero setup required. You can also connect your public or private GitHub repositories:
                  </p>
                  <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc pl-5">
                    <li>Navigate to <strong>My Repositories</strong> (`/repositories`).</li>
                    <li>Click <strong>Connect GitHub</strong> to authenticate via GitHub OAuth.</li>
                    <li>Select any authorized repository and trigger <strong>Index Repository</strong>.</li>
                    <li>The background indexer parses all files, extracts AST symbols, and constructs the knowledge graph.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-bold">3. First Code Query with Receipts</h2>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Open the AI Assistant (`/assistant`) and ask any question about the codebase. Notice the verified line citations rendered directly in the response:
                  </p>
                  <pre className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)]">
                    Q: &quot;Where does authentication start?&quot;{"\n"}A: &quot;Authentication starts in src/components/LoginForm.tsx:26 via handleSubmit...&quot;{"\n"}Receipts: [src/components/LoginForm.tsx:26-38, src/services/auth.ts:18-35]
                  </pre>
                </div>
              </section>
            )}

            {/* 2. CORE FEATURES */}
            {activeSection === "features" && (
              <section className="space-y-8">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">Core Features</h1>
                  <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    Detailed reference documentation for all capabilities verified in CodeAtlas.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Network className="w-4 h-4 text-purple-500" />
                    <span>Repository Knowledge Graph</span>
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Extracts 10 entity types (`file`, `directory`, `function`, `class`, `service`, `endpoint`, `model`, `test`, `config`, `doc`) and 9 relationship types (`imports`, `calls`, `defines`, `references`, `implements`, `tests`, `depends_on`, `accesses_db`, `configures`). Computes completeness scores and isolates $K$-hop neighborhoods for scalable traversal.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyan-500" />
                    <span>Symbol-Level Code Navigation</span>
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Embedded directly in the Source Code Viewer. Highlight or click any symbol to view its declaration line, upstream caller functions, downstream callees, cross-file references, and linked automated tests.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-emerald-500" />
                    <span>Workflow Trace Explorer</span>
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Select any entry point (such as `handleSubmit` or API handlers) to trace sequential execution across UI, service, persistence, and test layers. Highlights verified AST calls and transparently discloses static analysis boundaries.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-rose-500" />
                    <span>Change-Impact Intelligence</span>
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Simulates code changes to calculate upstream callers, downstream dependents, and affected test suites, producing a composite 0-100 risk score with blast radius file breakdowns.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-blue-500" />
                    <span>AI Pull Request Reviews</span>
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Ingests Git diffs and analyzes changes in repository context to detect security vulnerabilities, performance regressions, and missing unit tests with publishable GitHub comment formatting.
                  </p>
                </div>
              </section>
            )}

            {/* 3. CONFIGURATION */}
            {activeSection === "configuration" && (
              <section className="space-y-6">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">Configuration Reference</h1>
                  <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    Environment variables, OAuth credentials, and local database settings.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-base font-bold">Environment Variables (`.env.local`)</h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Copy `.env.example` to `.env.local` to configure optional cloud integrations:
                  </p>
                  <pre className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)] leading-relaxed">
                    # Next.js Port and Base URL{"\n"}PORT=3000{"\n"}NEXT_PUBLIC_APP_URL=http://localhost:3000{"\n\n"}# Optional: External AI Provider Keys (Offline AST engine active by default){"\n"}OPENAI_API_KEY=sk-...{"\n"}ANTHROPIC_API_KEY=sk-ant-...{"\n"}GEMINI_API_KEY=AIza...{"\n\n"}# Optional: GitHub OAuth Integration{"\n"}GITHUB_CLIENT_ID=your_client_id{"\n"}GITHUB_CLIENT_SECRET=your_client_secret
                  </pre>
                </div>

                <div className="space-y-3">
                  <h2 className="text-base font-bold">Database Storage (`data/codeatlas-db.json`)</h2>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    CodeAtlas persists users, repositories, files, symbols, graph edges, and review sessions in a local JSON document database. It automatically initializes upon first server start if missing.
                  </p>
                </div>
              </section>
            )}

            {/* 4. LOCAL DEVELOPMENT */}
            {activeSection === "development" && (
              <section className="space-y-6">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">Development &amp; Commands</h1>
                  <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    Standard development workflows, test commands, and build scripts.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-base font-bold">CLI Scripts Overview</h2>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex justify-between items-center">
                      <span>npm run dev</span>
                      <span className="text-[var(--text-secondary)]">Start dev server on localhost:3000</span>
                    </div>
                    <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex justify-between items-center">
                      <span>npm run test</span>
                      <span className="text-[var(--text-secondary)]">Execute unit, integration, e2e, phase12 tests</span>
                    </div>
                    <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex justify-between items-center">
                      <span>npm run lint</span>
                      <span className="text-[var(--text-secondary)]">Run Next.js ESLint checks</span>
                    </div>
                    <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex justify-between items-center">
                      <span>npm run typecheck</span>
                      <span className="text-[var(--text-secondary)]">Run TypeScript tsc --noEmit</span>
                    </div>
                    <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex justify-between items-center">
                      <span>npm run test:all</span>
                      <span className="text-[var(--text-secondary)]">Full quality gate + production build</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 5. TROUBLESHOOTING */}
            {activeSection === "troubleshooting" && (
              <section className="space-y-6">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">Troubleshooting Guide</h1>
                  <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    Solutions to common development, indexing, and environment issues.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1.5">
                    <div className="font-bold text-xs text-[var(--text-primary)]">Q: Missing OpenAI or Gemini API Keys?</div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      CodeAtlas does not crash or block execution when API keys are absent. It automatically switches to local deterministic AST synthesis, querying the indexed knowledge graph directly to produce grounded citations.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1.5">
                    <div className="font-bold text-xs text-[var(--text-primary)]">Q: Stale Indexing Warning in Knowledge Report?</div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      When files are modified or re-indexed, the Knowledge Report displays a stale badge. Click <strong>Refresh Report</strong> on the Knowledge Report tab to re-synthesize overview metrics.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1.5">
                    <div className="font-bold text-xs text-[var(--text-primary)]">Q: Port 3000 in Use?</div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Next.js automatically falls back to port 3001 or 3002. You can specify a custom port with <code className="font-mono bg-[var(--bg-surface)] px-1 py-0.5 rounded">npm run dev -- -p 3005</code>.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 6. SECURITY & PRIVACY */}
            {activeSection === "security" && (
              <section className="space-y-6">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">Security &amp; Privacy Architecture</h1>
                  <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                    How CodeAtlas protects your proprietary intellectual property and prevents security regressions.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1.5">
                    <div className="font-bold text-xs text-green-500">1. Zero Training on User Source Code</div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Source code ingested by CodeAtlas is stored in local/isolated data stores. It is never used to train public language models.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1.5">
                    <div className="font-bold text-xs text-green-500">2. Prompt Injection Mitigations</div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      All user-provided prompts and code snippets pass through strict sanitization filters blocking override directives before entering LLM contexts.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1.5">
                    <div className="font-bold text-xs text-green-500">3. Directory Traversal &amp; Null-Byte Defense</div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      File paths are validated against parent directories to prevent <code className="font-mono bg-[var(--bg-surface)] px-1 py-0.5 rounded">../</code> traversal or arbitrary filesystem reads.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1.5">
                    <div className="font-bold text-xs text-green-500">4. Secret &amp; Credential Redaction in Logs</div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      GitHub personal access tokens and cloud provider keys are automatically replaced with <code className="font-mono bg-[var(--bg-surface)] px-1 py-0.5 rounded">[REDACTED_SECRET]</code> in observability logs.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
