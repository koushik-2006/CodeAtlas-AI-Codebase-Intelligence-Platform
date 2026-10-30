"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import {
  Code2,
  GitFork,
  Sparkles,
  Network,
  GitCompare,
  GitPullRequest,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  Terminal,
} from "lucide-react";

export default function FeaturesPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const features = [
    {
      id: "knowledge-graph",
      title: "Repository Knowledge Graph",
      problem: "Developers waste days mentally mapping large codebases and miss cross-file relationships.",
      solution: "Parses AST syntax trees into an interactive graph of 10 entity types and 9 relationship types with verified proof.",
      limitations: "Dynamic runtime reflection or indirect event bus dispatches are marked as heuristics.",
      route: "/architecture",
      routeLabel: "View Architecture Graph",
      icon: Network,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      codeSnippet: "// Sample Extracted Entity\n{\n  \"entity\": \"loginUser\",\n  \"type\": \"function\",\n  \"calls\": [\"UserService.findUserByEmail\", \"validateEmail\"],\n  \"testedBy\": [\"auth.test.ts:testLoginSuccess\"]\n}",
    },
    {
      id: "symbol-navigation",
      title: "Symbol-Level Code Navigation",
      problem: "Text-based grep search produces false positives and cannot isolate upstream callers vs downstream callees.",
      solution: "Inspect any symbol to instantly jump to its definition, upstream callers, downstream callees, and linked test assertions.",
      limitations: "Full syntactic caller trees are supported for TypeScript/JavaScript; other languages use syntactic token fallbacks.",
      route: "/repositories/sample-project?file=src%2Fservices%2Fauth.ts&line=18",
      routeLabel: "Inspect Symbol in Explorer",
      icon: Search,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      codeSnippet: "// Symbol Inspector Resolution\nloginUser()\n  ├── Callers: LoginForm.tsx:handleSubmit [L26]\n  ├── Callees: UserService.findUserByEmail [L44]\n  └── Tests:   auth.test.ts:testLoginSuccess [L18]",
    },
    {
      id: "workflow-trace",
      title: "Architectural Workflow Trace Explorer",
      problem: "Understanding end-to-end request flows requires manual cross-file jumping across UI, service, database, and test tiers.",
      solution: "Traces sequential execution from UI handlers (handleSubmit) down through domain services to persistence queries and unit tests.",
      limitations: "Represents static call graphs and does not predict dynamic branching conditions or network latency.",
      route: "/repositories/sample-project?tab=workflow",
      routeLabel: "Launch Workflow Trace",
      icon: GitFork,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      codeSnippet: "Step 1: LoginForm.tsx:handleSubmit [UI]\nStep 2: auth.ts:loginUser [Service]\nStep 3: auth.ts:UserService.findUserByEmail [DB]\nStep 4: auth.test.ts:testLoginSuccess [Test]",
    },
    {
      id: "grounded-ai",
      title: "Grounded AI with Source Receipts",
      problem: "Generic LLM assistants hallucinate non-existent files, methods, and incorrect line numbers.",
      solution: "RAG engine retrieves bounded AST context and formats every claim with verifiable file and line number receipts.",
      limitations: "Requires local repository indexing. Unindexed files cannot produce grounded citations.",
      route: "/assistant",
      routeLabel: "Open AI Assistant",
      icon: Sparkles,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      codeSnippet: "Q: Where does session rotation occur?\nA: In src/services/auth.ts:62 inside issueSessionToken().\nReceipts: [src/services/auth.ts:62-75]",
    },
    {
      id: "change-impact",
      title: "Change Impact & Blast Radius Intelligence",
      problem: "Modifying core utility or service functions introduces unexpected regressions across dependent files and tests.",
      solution: "Calculates in-degree callers, downstream callees, and impacted test suites to generate a verified 0-100 risk score.",
      limitations: "Impact scoring evaluates static direct and transitive dependents within the indexed repository.",
      route: "/change-impact",
      routeLabel: "Explore Change Impact",
      icon: GitCompare,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      codeSnippet: "Target: loginUser (src/services/auth.ts)\nRisk Level: Medium (Score: 45/100)\nBlast Radius: 4 files, 1 automated test suite",
    },
    {
      id: "code-review",
      title: "AI Pull Request Code Review",
      problem: "Manual PR reviews miss subtle security bugs, edge cases, and missing test assertions.",
      solution: "Analyzes Git diffs with repository context to detect security vulnerabilities, logic regressions, and missing tests.",
      limitations: "Generates recommendations for human engineering review; does not automatically merge pull requests.",
      route: "/code-review",
      routeLabel: "Open Code Review Hub",
      icon: GitPullRequest,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      codeSnippet: "Finding: Hardcoded session secret detected in auth.ts:32\nSeverity: High\nRecommendation: Migrate to process.env.SESSION_SECRET",
    },
    {
      id: "codelens-ocr",
      title: "Visual CodeLens & Screenshot OCR",
      problem: "Extracting code from documentation screenshots, video tutorials, or legacy slide decks requires tedious typing.",
      solution: "High-accuracy OCR extracts formatted code blocks from pasted or uploaded images with automatic language detection.",
      limitations: "Blurry, low-contrast, or heavily skewed images may require manual character correction.",
      route: "/visual-explorer",
      routeLabel: "Try Visual CodeLens",
      icon: Code2,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      codeSnippet: "// Extracted from Screenshot\nconst session = await loginUser(email, password);\n// 100% syntactically verified TypeScript block",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors py-10 px-5">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-[var(--border-color)]">
          <Link href="/" aria-label="CodeAtlas Home">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/demo"
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Demo
            </Link>
            <Link
              href="/docs"
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/login"
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3.5 py-1 font-mono text-xs font-bold text-[var(--primary)] border border-[var(--primary)]/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verifiable Architecture Intelligence</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Built for Developers Who Need Truth, Not Hallucinations
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
            Every feature in CodeAtlas is grounded in actual Abstract Syntax Trees, verified source citations, and deterministic graph algorithms.
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm grid lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${feat.bg} ${feat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      {feat.title}
                    </h2>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-[var(--text-primary)]">Problem: </span>
                      <span className="text-[var(--text-secondary)]">{feat.problem}</span>
                    </div>
                    <div>
                      <span className="font-bold text-green-500">Solution: </span>
                      <span className="text-[var(--text-primary)] font-medium">{feat.solution}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-page)]/60 border border-[var(--border-color)] flex items-start gap-2 text-[11px] text-[var(--text-secondary)]">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Boundary &amp; Limitations:</strong> {feat.limitations}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={feat.route}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
                    >
                      <span>{feat.routeLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <pre className="p-5 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed shadow-inner">
                    {feat.codeSnippet}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="p-10 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-center space-y-4 shadow-sm">
          <h2 className="text-2xl font-extrabold tracking-tight">
            See the Platform in Action
          </h2>
          <p className="max-w-xl mx-auto text-sm text-[var(--text-secondary)]">
            Explore the standalone interactive demo without configuring credentials, or set up CodeAtlas on your machine in 5 minutes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/demo"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-md active:scale-95 ${
                isDark
                  ? "bg-[#29D3C2] text-[#0E1116] hover:bg-[#22b5a6]"
                  : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
              }`}
            >
              <span>Explore Interactive Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/quickstart"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm border border-[var(--border-color)] bg-[var(--bg-page)] hover:border-[var(--primary)] text-[var(--text-primary)] transition-all"
            >
              <Terminal className="w-4 h-4" />
              <span>Developer Quickstart</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
