"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { Compass, Sparkles, ArrowRight, CheckCircle2, GitFork, ExternalLink } from "lucide-react";

export function DemoTeaserSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 scroll-mt-16">
      <div className="p-8 sm:p-12 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[var(--border-color)]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Compass className="w-3.5 h-3.5" />
              <span>Interactive Product Sandbox</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Test CodeAtlas Right in Your Browser
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl">
              Experience the full intelligence engine on a real TypeScript authentication service—complete with workflow tracing, symbol inspection, and grounded AI responses.
            </p>
          </div>

          <Link
            href="/demo"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs sm:text-sm transition-all shadow-md shrink-0 active:scale-95 ${
              isDark
                ? "bg-[#29D3C2] text-[#0E1116] hover:bg-[#22b5a6]"
                : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
            }`}
          >
            <span>Launch Standalone Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Interactive preview showcase card */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] font-mono">
              <GitFork className="w-4 h-4" />
              <span>1. Multi-Tier Tracing</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Trace from UI handlers down through domain services to database queries and linked tests.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-500 font-mono">
              <Sparkles className="w-4 h-4" />
              <span>2. Verified Receipts</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Every answer includes verifiable file paths and line ranges derived directly from AST syntax.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-green-500 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>3. Zero Credentials</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              No GitHub authorization or OpenAI API tokens required to evaluate the platform.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
