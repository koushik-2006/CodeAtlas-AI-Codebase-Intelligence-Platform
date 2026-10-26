"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { CodeCityIllustration } from "./CodeCityIllustration";
import { Google } from "@/components/Icons";

export function HeroSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:pt-16">
      <div>
        {/* Eyebrow label */}
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-3.5 py-1.5 font-mono text-xs font-bold text-[var(--primary)] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
          <span>CodeAtlas 2.0 • AI-Powered Codebase Intelligence</span>
        </div>

        {/* Headline */}
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight md:text-5xl lg:text-[60px]">
          Understand any codebase.{" "}
          <span
            className={
              isDark
                ? "text-transparent bg-clip-text bg-gradient-to-r from-[#29D3C2] to-[#8B7CFF]"
                : "text-[#6C4DFF]"
            }
          >
            Trace every connection.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="mt-5 max-w-lg text-base sm:text-lg font-medium text-[var(--text-secondary)] leading-relaxed">
          Explore unfamiliar repositories, inspect caller and callee trees, trace multi-tier workflows, and review pull requests—with verified receipts beside every answer.
        </p>

        {/* Persona Indicator */}
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-secondary)] font-mono">
          <span className="text-[var(--primary)] font-bold">Built for:</span>
          <span>Software Engineers, Tech Leads &amp; Security Reviewers</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-7 flex flex-wrap items-center gap-3.5">
          <Link
            href="/login"
            className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm transition-all shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
              isDark
                ? "bg-[#29D3C2] text-[#0E1116] hover:bg-[#22b5a6] shadow-[0_0_25px_-5px_rgba(41,211,194,0.4)]"
                : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
            }`}
          >
            <span>Start Using CodeAtlas</span>
          </Link>

          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--primary)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] text-[var(--text-primary)]"
          >
            <span>Explore Interactive Demo</span>
          </Link>
        </div>
      </div>

      {/* Right theme-aware illustration & UI preview */}
      <div className="w-full space-y-4">
        <CodeCityIllustration />

        {/* Grounded Receipt Preview Card */}
        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]/90 backdrop-blur-sm shadow-sm space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5 font-bold text-[var(--primary)]">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Verified AST Workflow Trace
            </span>
            <span>sample-project</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] text-[11px] text-[var(--text-primary)] space-y-1">
            <div className="text-[var(--text-secondary)]">handleSubmit() → loginUser() → UserService</div>
            <div className="text-green-600 dark:text-green-400 font-bold">
              ✔ 100% Proven Call Chain • 1 Linked Test Assertion
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
