"use client";

import Link from "next/link";
import { Compass, Sparkles, ArrowRight, CheckCircle2, GitFork } from "lucide-react";

export function DemoTeaserSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 scroll-mt-20">
      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-8 sm:p-12 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-color)]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Compass className="w-3.5 h-3.5" />
              <span>INTERACTIVE PRODUCT SANDBOX</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Test CodeAtlas Right in Your Browser
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl font-medium">
              Experience the full intelligence engine on a real TypeScript authentication service—complete with workflow tracing, symbol inspection, and grounded AI responses.
            </p>
          </div>

          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-md active:scale-95 bg-gradient-to-r from-[#7C5CFC] to-[#5A38E6] hover:from-[#6A4BE8] hover:to-[#4A28D6] shadow-[0_0_24px_-6px_rgba(124,92,252,0.45)] shrink-0"
          >
            <span>Launch Standalone Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Interactive preview showcase card */}
        <div className="grid md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)]/70 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] font-mono">
              <GitFork className="w-4 h-4" />
              <span>1. Multi-Tier Tracing</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              Trace from UI handlers down through domain services to database queries and linked tests.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)]/70 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">
              <Sparkles className="w-4 h-4" />
              <span>2. Verified Receipts</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              Every answer includes verifiable file paths and line ranges derived directly from AST syntax.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)]/70 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>3. Zero Credentials Required</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              No GitHub authorization or external AI tokens required to explore the platform sandbox.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
