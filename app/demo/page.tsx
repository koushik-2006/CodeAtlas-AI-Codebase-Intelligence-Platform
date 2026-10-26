"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import {
  DEMO_REPOSITORY_INFO,
  DEMO_TRACE_STEPS,
  DEMO_GROUNDED_QUERIES,
  DEMO_CHANGE_IMPACT,
  DEMO_SYMBOL_RESOLUTION,
  DemoGroundedQuery,
} from "@/lib/demo/demo-data";
import {
  GitFork,
  Sparkles,
  Search,
  GitCompare,
  Code2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ExternalLink,
  Layers,
  FileCode2,
  Compass,
  TestTube2,
  Terminal,
} from "lucide-react";

type DemoTab = "workflow" | "queries" | "symbol" | "impact" | "code";

export default function DemoPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<DemoTab>("workflow");
  const [selectedStep, setSelectedStep] = useState(1);
  const [selectedQuery, setSelectedQuery] = useState<DemoGroundedQuery>(DEMO_GROUNDED_QUERIES[0]);
  const [activeCodeFile, setActiveCodeFile] = useState<"login" | "auth" | "test">("auth");

  const sampleCodes = {
    login: `// src/components/LoginForm.tsx
import React, { useState } from "react";
import { loginUser } from "../services/auth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = await loginUser(email, password);
      console.log("Authenticated:", session.token);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  );
}`,
    auth: `// src/services/auth.ts
import { validateEmail } from "../utils/validation";

export interface SessionToken {
  token: string;
  expiresIn: number;
}

export async function loginUser(email: string, pass: string): Promise<SessionToken> {
  if (!validateEmail(email)) {
    throw new Error("Invalid email format");
  }

  const user = await UserService.findUserByEmail(email);
  if (!user || !(await UserService.verifyPassword(pass, user.hash))) {
    throw new Error("Invalid credentials");
  }

  return { token: "atlas_jwt_" + Date.now(), expiresIn: 3600 };
}

export class UserService {
  static async findUserByEmail(email: string) {
    return { id: "usr_1", email, hash: "sha256_mock" };
  }
  static async verifyPassword(pass: string, hash: string) {
    return pass.length > 6;
  }
}`,
    test: `// tests/auth.test.ts
import { loginUser } from "../src/services/auth";

describe("Authentication Service", () => {
  test("testLoginSuccess", async () => {
    const session = await loginUser("alice@example.com", "SecretPass123!");
    expect(session.token).toBeDefined();
    expect(session.expiresIn).toBe(3600);
  });

  test("testInvalidEmailThrows", async () => {
    await expect(loginUser("invalid-email", "pass")).rejects.toThrow("Invalid email");
  });
});`,
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-color)] bg-[var(--bg-page)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="CodeAtlas Home">
              <Logo size="md" />
            </Link>
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              Interactive Demo
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <ThemeToggle />
            <Link
              href="/docs"
              className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/repositories/sample-project"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all shadow-sm ${
                isDark
                  ? "bg-[#29D3C2] text-[#0E1116] hover:bg-[#22b5a6]"
                  : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
              }`}
            >
              <span>Launch Full App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Demo Workspace */}
      <main className="mx-auto max-w-7xl px-5 py-6 space-y-6">
        {/* Banner: Demo Mode Context */}
        <div className="p-4 sm:p-5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 shrink-0 mt-0.5 sm:mt-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                <span>Demo Workspace: {DEMO_REPOSITORY_INFO.name}</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                  Standalone / Offline
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Experience CodeAtlas features grounded in an authentic TypeScript repository without requiring GitHub tokens or OpenAI API keys.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0 font-mono">
            <span className="text-[var(--text-secondary)]">AST Verification:</span>
            <span className="font-bold text-green-500">100% Proven</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("workflow")}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "workflow"
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] font-black"
                  : "bg-[#6C4DFF] text-white font-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>Workflow Trace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("queries")}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "queries"
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] font-black"
                  : "bg-[#6C4DFF] text-white font-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Grounded AI Questions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("symbol")}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "symbol"
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] font-black"
                  : "bg-[#6C4DFF] text-white font-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Symbol Navigation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("impact")}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "impact"
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] font-black"
                  : "bg-[#6C4DFF] text-white font-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Change Impact Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all whitespace-nowrap ${
              activeTab === "code"
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] font-black"
                  : "bg-[#6C4DFF] text-white font-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Sample Code Viewer</span>
          </button>
        </div>

        {/* TAB 1: WORKFLOW TRACE */}
        {activeTab === "workflow" && (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-2.5">
              <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Execution Steps (Entry: handleSubmit)
              </div>
              {DEMO_TRACE_STEPS.map((step) => {
                const isSelected = selectedStep === step.step;
                return (
                  <button
                    key={step.step}
                    type="button"
                    onClick={() => setSelectedStep(step.step)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm"
                        : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--border-color)]/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center ${
                          isSelected
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[var(--border-color)]/40 text-[var(--text-secondary)]"
                        }`}
                      >
                        {step.step}
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                          {step.entityName}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          {step.relation}
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] px-2 py-0.5 rounded uppercase font-bold text-[var(--text-secondary)] bg-[var(--bg-page)]">
                      {step.layer}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7">
              {(() => {
                const curr = DEMO_TRACE_STEPS.find((s) => s.step === selectedStep) || DEMO_TRACE_STEPS[0];
                return (
                  <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-[var(--primary)]">
                          Step {curr.step} of {DEMO_TRACE_STEPS.length}
                        </span>
                        <span className="text-[var(--text-secondary)]">•</span>
                        <span className="text-[var(--text-secondary)] font-bold">{curr.filePath}:{curr.line}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        AST Proven Call
                      </span>
                    </div>

                    <div>
                      <div className="text-xs text-[var(--text-secondary)] mb-1">Entity Operation:</div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">
                        {curr.entityName} — {curr.relation}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-[var(--text-secondary)] mb-1.5 font-mono">
                        Source Evidence:
                      </div>
                      <pre className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed">
                        {curr.codeSnippet}
                      </pre>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-page)]/50 border border-[var(--border-color)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
                      <span>Layer: <strong className="uppercase text-[var(--text-primary)]">{curr.layer}</strong></span>
                      <Link
                        href={`/repositories/sample-project?file=${encodeURIComponent(curr.filePath)}&line=${curr.line}`}
                        className="text-[var(--primary)] font-bold hover:underline inline-flex items-center gap-1"
                      >
                        Inspect in Full App <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 2: GROUNDED AI QUESTIONS */}
        {activeTab === "queries" && (
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                Click a Question to View Grounded Answer
              </div>
              {DEMO_GROUNDED_QUERIES.map((q) => {
                const isSelected = selectedQuery.id === q.id;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQuery(q)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all space-y-1.5 ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm"
                        : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--border-color)]/80"
                    }`}
                  >
                    <div className="font-bold text-xs text-[var(--text-primary)] flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--primary)] shrink-0 mt-0.5" />
                      <span>{q.question}</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] font-mono pl-5.5">
                      {q.citations.length} verified citation receipt(s)
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7">
              <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                  <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Grounded AI Response
                  </div>
                  <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    AST Context Grounded
                  </span>
                </div>

                <div className="font-bold text-sm text-[var(--text-primary)]">
                  Q: {selectedQuery.question}
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-page)]/80 border border-[var(--border-color)] text-xs text-[var(--text-primary)] leading-relaxed">
                  {selectedQuery.answer}
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span>Verified Source Citations & Line Receipts</span>
                  </div>

                  {selectedQuery.citations.map((c, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-[var(--primary)]">
                          {c.file}:{c.lineRange[0]}-{c.lineRange[1]}
                        </span>
                        <span className="text-[var(--text-secondary)]">{c.symbolName}</span>
                      </div>
                      <pre className="font-mono text-xs text-[var(--text-secondary)] truncate">
                        {c.snippet}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYMBOL NAVIGATION */}
        {activeTab === "symbol" && (
          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
              <div>
                <div className="text-xs text-[var(--text-secondary)] font-mono">Target Symbol:</div>
                <div className="text-base font-extrabold font-mono text-[var(--text-primary)] flex items-center gap-2">
                  <span>{DEMO_SYMBOL_RESOLUTION.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {DEMO_SYMBOL_RESOLUTION.type}
                  </span>
                </div>
              </div>

              <div className="font-mono text-xs text-[var(--text-secondary)]">
                Declared in: <strong className="text-[var(--text-primary)]">{DEMO_SYMBOL_RESOLUTION.file}:{DEMO_SYMBOL_RESOLUTION.line}</strong>
              </div>
            </div>

            <div className="grid sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]">
                <div className="text-xs text-[var(--text-secondary)] font-mono">Upstream Callers</div>
                <div className="text-2xl font-black mt-1 text-[var(--primary)]">{DEMO_SYMBOL_RESOLUTION.callersCount}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">LoginForm.tsx:26</div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]">
                <div className="text-xs text-[var(--text-secondary)] font-mono">Downstream Callees</div>
                <div className="text-2xl font-black mt-1 text-cyan-500">{DEMO_SYMBOL_RESOLUTION.calleesCount}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">UserService, validateEmail</div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]">
                <div className="text-xs text-[var(--text-secondary)] font-mono">Cross-File References</div>
                <div className="text-2xl font-black mt-1 text-amber-500">{DEMO_SYMBOL_RESOLUTION.referencesCount}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">Across 4 files</div>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]">
                <div className="text-xs text-[var(--text-secondary)] font-mono">Linked Test Assertions</div>
                <div className="text-2xl font-black mt-1 text-green-500">{DEMO_SYMBOL_RESOLUTION.testsCount}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">auth.test.ts:18</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-[var(--text-secondary)] font-mono mb-2">TypeScript Signature:</div>
              <pre className="p-3.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)]">
                {DEMO_SYMBOL_RESOLUTION.signature}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: CHANGE IMPACT */}
        {activeTab === "impact" && (
          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
              <div>
                <div className="text-xs text-[var(--text-secondary)]">Simulated Code Change:</div>
                <div className="text-sm font-bold text-[var(--text-primary)] font-mono">
                  Modify function &apos;{DEMO_CHANGE_IMPACT.symbolName}()&apos; ({DEMO_CHANGE_IMPACT.filePath}:{DEMO_CHANGE_IMPACT.line})
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--text-secondary)]">Calculated Risk:</span>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {DEMO_CHANGE_IMPACT.riskLevel} Risk (Score: {DEMO_CHANGE_IMPACT.riskScore}/100)
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-2">
                <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[var(--primary)]" />
                  <span>Upstream In-Degree Callers ({DEMO_CHANGE_IMPACT.upstreamCallers.length})</span>
                </div>
                <ul className="text-xs font-mono text-[var(--text-secondary)] space-y-1">
                  {DEMO_CHANGE_IMPACT.upstreamCallers.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-2">
                <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <TestTube2 className="w-4 h-4 text-green-500" />
                  <span>Affected Automated Tests ({DEMO_CHANGE_IMPACT.affectedTests.length})</span>
                </div>
                <ul className="text-xs font-mono text-[var(--text-secondary)] space-y-1">
                  {DEMO_CHANGE_IMPACT.affectedTests.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-2">
              <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-cyan-500" />
                <span>Blast Radius Files ({DEMO_CHANGE_IMPACT.blastRadiusFiles.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEMO_CHANGE_IMPACT.blastRadiusFiles.map((f, i) => (
                  <span
                    key={i}
                    className="font-mono text-xs px-2.5 py-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SAMPLE CODE VIEWER */}
        {activeTab === "code" && (
          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
              <button
                type="button"
                onClick={() => setActiveCodeFile("auth")}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                  activeCodeFile === "auth"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                src/services/auth.ts
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeFile("login")}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                  activeCodeFile === "login"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                src/components/LoginForm.tsx
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeFile("test")}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                  activeCodeFile === "test"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                tests/auth.test.ts
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto leading-relaxed">
              {sampleCodes[activeCodeFile]}
            </pre>
          </div>
        )}

        {/* Bottom Call to Action */}
        <div className="p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-center space-y-4 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Ready to explore your own codebase?
          </h2>
          <p className="max-w-xl mx-auto text-sm text-[var(--text-secondary)]">
            Connect a GitHub repository or clone CodeAtlas locally to run full AST parsing, architectural knowledge graphs, and pull request intelligence.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-md active:scale-95 ${
                isDark
                  ? "bg-[#29D3C2] text-[#0E1116] hover:bg-[#22b5a6]"
                  : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
              }`}
            >
              <span>Get Started Free</span>
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
      </main>
    </div>
  );
}
