"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  GitBranch,
  Bot,
  FolderTree,
  ShieldCheck,
  CheckCircle2,
  FileCode2,
  ArrowRight,
  Sparkles,
  GitPullRequest,
  Search,
  Activity,
  Layers,
  Code2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

export function ProductPreviewSection() {
  const [activeTab, setActiveTab] = useState<"architecture" | "assistant" | "explorer" | "impact">("architecture");

  return (
    <section id="platform" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 scroll-mt-20">
      {/* Header and Eyebrow */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3.5 py-1.5 font-mono text-xs font-bold text-[var(--primary)] shadow-xs">
          <Compass className="w-3.5 h-3.5" />
          <span>PLATFORM CAPABILITIES PREVIEW</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-[var(--text-primary)]">
          The Developer Command Center for Codebase Intelligence
        </h2>
        <p className="text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
          Experience how CodeAtlas parses your repositories into an interactive graph of modules, symbols, call chains, and verified AI explanations.
        </p>
      </div>

      {/* Main Interactive Product Shell */}
      <div className="relative rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-xl overflow-hidden transition-all duration-300">
        {/* Sample Data Notice Banner */}
        <div className="bg-gradient-to-r from-[var(--primary)]/10 via-cyan-500/10 to-[var(--primary)]/10 border-b border-[var(--border-color)] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="font-bold text-[var(--text-primary)]">Interactive Product Simulation</span>
            <span className="hidden sm:inline">• Sample Repository: <code className="text-[var(--primary)] font-bold">acme-corp/payment-service</code></span>
          </div>
          <span className="text-[11px] rounded bg-[var(--bg-page)] px-2 py-0.5 border border-[var(--border-color)] text-[var(--text-secondary)]">
            Sample Preview Data
          </span>
        </div>

        {/* Dashboard Top Application Bar */}
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/60 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)]">Modules:</span>
              <span className="font-bold text-[var(--text-primary)]">12</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)]">Files:</span>
              <span className="font-bold text-[var(--text-primary)]">46</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)]">AST Symbols:</span>
              <span className="font-bold text-[var(--text-primary)]">198</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)]">Arch Health:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">96 / 100</span>
            </div>
          </div>

          {/* Connect Repo CTA */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all shadow-xs"
          >
            <span>Analyze Your Repo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-page)]/70 px-2 sm:px-6 overflow-x-auto no-scrollbar">
          <div className="flex space-x-1 sm:space-x-2 py-2">
            {[
              { id: "architecture", label: "Architecture Graph", icon: GitBranch },
              { id: "assistant", label: "AI Assistant & Receipts", icon: Bot },
              { id: "explorer", label: "Symbol & Repo Explorer", icon: FolderTree },
              { id: "impact", label: "Change Impact Analysis", icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                    isActive
                      ? "bg-[var(--bg-surface)] text-[var(--primary)] shadow-xs border border-[var(--border-color)] font-bold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[var(--primary)]" : "text-[var(--text-secondary)]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Viewport Contents */}
        <div className="p-4 sm:p-6 lg:p-8 bg-[var(--bg-surface)] min-h-[420px]">
          {/* TAB 1: Architecture Graph View */}
          {activeTab === "architecture" && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--text-primary)]">
                    <GitBranch className="w-4 h-4 text-[var(--primary)]" />
                    <span>Module Call Graph: Payment Processing Pipeline</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    AST Validated
                  </span>
                </div>

                {/* Graph Node Connections Simulation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2">
                  <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-xs space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-cyan-600 dark:text-cyan-400">1. Client / Route</span>
                    <div className="font-bold text-sm text-[var(--text-primary)] truncate">POST /api/v1/charge</div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)]">routes/charge.ts:L14</div>
                    <div className="text-[10px] text-[var(--primary)] font-semibold">1 caller → 3 callees</div>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-[var(--primary)] bg-[var(--bg-surface)] shadow-md space-y-2 relative">
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[var(--primary)] text-white">
                      Selected
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold text-[var(--primary)]">2. Domain Service</span>
                    <div className="font-bold text-sm text-[var(--text-primary)] truncate">executePayment()</div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)]">services/payment.ts:L45</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Verified AST Link</div>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-xs space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-purple-600 dark:text-purple-400">3. Persistence</span>
                    <div className="font-bold text-sm text-[var(--text-primary)] truncate">ledgerRepository.save()</div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)]">db/repositories/ledger.ts</div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-semibold">PostgreSQL Driver</div>
                  </div>
                </div>

                {/* Trace Flow Banner */}
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 font-mono text-xs text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Path: ChargeRoute → validateCard() → executePayment() → recordAudit()</span>
                  </div>
                  <span className="font-bold text-[var(--text-primary)]">Depth: 4 hops</span>
                </div>
              </div>

              {/* Node Inspector Panel */}
              <div className="lg:col-span-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">Node Inspector</span>
                  <span className="text-[11px] font-mono text-[var(--primary)] font-bold">Function</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[var(--text-secondary)] text-[11px]">Symbol Signature</span>
                    <div className="mt-1 font-mono font-bold text-sm text-[var(--text-primary)]">
                      executePayment(intent: PaymentIntent): Promise&lt;Receipt&gt;
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">File:</span>
                      <span className="font-semibold text-[var(--text-primary)]">services/payment.ts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Lines:</span>
                      <span className="font-semibold text-[var(--text-primary)]">L45 - L112</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">Cyclomatic Complexity:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">4 (Low)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[var(--text-secondary)] text-[11px] font-semibold">Incoming Callers (2):</span>
                    <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[11px] text-[var(--text-primary)]">
                      • POST /api/v1/charge (routes/charge.ts:32)
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[11px] text-[var(--text-primary)]">
                      • SubscriptionWorker.processBatch() (workers/sub.ts:89)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI Assistant & Receipts */}
          {activeTab === "assistant" && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] p-5 space-y-4">
                {/* Chat Message 1: User */}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    You
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] shadow-xs">
                    How is webhook signature verification handled for Stripe events?
                  </div>
                </div>

                {/* Chat Message 2: CodeAtlas Grounded Assistant */}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#7C5CFC] to-[#22D3EE] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-3 text-xs text-[var(--text-primary)] shadow-sm">
                    <p className="leading-relaxed">
                      Webhook signatures are verified synchronously in <code className="font-mono text-[var(--primary)] font-bold">app/api/webhooks/stripe/route.ts</code> using <code className="font-mono">stripe.webhooks.constructEvent()</code> before any event payload is queued.
                    </p>

                    {/* Grounded Citation Receipt Tag */}
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>AST Receipt: Verified Source Evidence</span>
                      </div>
                      <div className="text-[var(--text-primary)]">
                        app/api/webhooks/stripe/route.ts: <span className="font-bold">Lines 24 - 41</span>
                      </div>
                      <div className="text-[var(--text-secondary)] text-[10px]">
                        Call Hierarchy: StripeWebhookHandler → verifyStripeSignature() → eventRouter()
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supporting Code Citation Viewer */}
              <div className="lg:col-span-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 font-mono text-xs">
                  <span className="font-bold text-[var(--text-primary)]">Evidence Source Receipt</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% AST Grounded</span>
                </div>

                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 font-mono text-[11px] space-y-1 overflow-x-auto">
                  <div className="text-[var(--text-secondary)]">{"// app/api/webhooks/stripe/route.ts:24-30"}</div>
                  <div className="text-purple-600 dark:text-purple-400">const sig = req.headers.get(&apos;stripe-signature&apos;);</div>
                  <div className="text-[var(--text-primary)]">const event = stripe.webhooks.constructEvent(</div>
                  <div className="text-[var(--text-primary)] pl-4">rawBody, sig, env.STRIPE_WEBHOOK_SECRET</div>
                  <div className="text-[var(--text-primary)]">);</div>
                  <div className="text-emerald-600 dark:text-emerald-400">{"// Verified: Throws SignatureVerificationError on mismatch"}</div>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)]">
                  CodeAtlas inspects the AST call graph to locate the exact constructEvent call site and verify test coverage.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Symbol & Repo Explorer */}
          {activeTab === "explorer" && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              {/* File Tree Hierarchy */}
              <div className="lg:col-span-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <span className="font-bold text-[var(--text-primary)]">Repository Files</span>
                  <span className="text-[var(--text-secondary)]">46 files</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="font-bold text-[var(--text-primary)]">📁 src/</div>
                  <div className="pl-4 text-[var(--text-secondary)]">📁 controllers/</div>
                  <div className="pl-8 text-emerald-600 dark:text-emerald-400 font-semibold">📄 PaymentController.ts</div>
                  <div className="pl-8 text-[var(--text-secondary)]">📄 AuthController.ts</div>
                  <div className="pl-4 text-[var(--text-secondary)]">📁 services/</div>
                  <div className="pl-8 text-[var(--primary)] font-bold bg-[var(--primary)]/10 px-2 py-0.5 rounded">
                    📄 payment.ts (8 exported symbols)
                  </div>
                  <div className="pl-8 text-[var(--text-secondary)]">📄 ledger.ts</div>
                  <div className="pl-4 text-[var(--text-secondary)]">📁 tests/</div>
                  <div className="pl-8 text-[var(--text-secondary)]">📄 payment.test.ts</div>
                </div>
              </div>

              {/* Extracted AST Symbols List */}
              <div className="lg:col-span-7 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 font-mono text-xs">
                  <span className="font-bold text-[var(--text-primary)]">AST Symbols in payment.ts</span>
                  <span className="text-[var(--primary)] font-bold">TypeScript Parser</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between">
                    <div>
                      <span className="text-[var(--primary)] font-bold">function</span>{" "}
                      <span className="font-bold text-[var(--text-primary)]">executePayment()</span>
                      <div className="text-[10px] text-[var(--text-secondary)]">Lines 45-112 • 2 callers, 4 callees</div>
                    </div>
                    <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                      Exported
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between">
                    <div>
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">interface</span>{" "}
                      <span className="font-bold text-[var(--text-primary)]">PaymentIntent</span>
                      <div className="text-[10px] text-[var(--text-secondary)]">Lines 12-28 • 6 referenced sites</div>
                    </div>
                    <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                      Exported
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] flex items-center justify-between">
                    <div>
                      <span className="text-purple-600 dark:text-purple-400 font-bold">function</span>{" "}
                      <span className="font-bold text-[var(--text-primary)]">validateCurrency()</span>
                      <div className="text-[10px] text-[var(--text-secondary)]">Lines 32-42 • Internal Helper</div>
                    </div>
                    <span className="rounded bg-[var(--border-color)] text-[var(--text-secondary)] px-2 py-0.5 text-[10px] font-bold">
                      Private
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Change Impact Analysis */}
          {activeTab === "impact" && (
            <div className="grid lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--text-primary)]">
                    <Activity className="w-4 h-4 text-[var(--primary)]" />
                    <span>Blast Radius Simulation: Modifying executePayment()</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Moderate Impact
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
                    <div className="flex justify-between font-mono">
                      <span className="text-[var(--text-secondary)]">Affected Downstream Files:</span>
                      <span className="font-bold text-[var(--text-primary)]">4 files</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-[var(--text-secondary)]">Affected API Endpoints:</span>
                      <span className="font-bold text-[var(--text-primary)]">1 endpoint (/api/v1/charge)</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-[var(--text-secondary)]">Linked Unit Tests:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">3 test suites (12 test cases)</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    Before committing changes, CodeAtlas alerts you to all transitive dependencies that rely on the function signature.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">Architectural Health &amp; Debt</span>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Score: 96%</span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Circular Dependencies</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">0 detected</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Orphaned Symbols</span>
                    </div>
                    <span className="font-bold text-[var(--text-primary)]">2 unused helpers</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Test Linkage Coverage</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">89%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
