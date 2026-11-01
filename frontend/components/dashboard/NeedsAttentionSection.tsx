"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import {
  AlertOctagon,
  ShieldAlert,
  AlertTriangle,
  Wrench,
  ArrowRight,
  FileCode,
} from "lucide-react";

interface AttentionItem {
  id: string;
  severity: "critical" | "high" | "warning";
  category: string;
  title: string;
  description: string;
  filePath: string;
  line: number;
  repoId: string;
  actionText: string;
  href: string;
}

const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "att-sec-1",
    severity: "critical",
    category: "Security Vulnerability",
    title: "WebAuthn challenge replay vulnerability in assertion validation",
    description:
      "Assertion handler parses creds without validating that the nonce was previously issued and not yet redeemed.",
    filePath: "src/services/auth.ts",
    line: 24,
    repoId: "sample-project",
    actionText: "Fix Vulnerability",
    href: "/code-review?repoId=sample-project&pr=101&finding=finding-sec-1",
  },
  {
    id: "att-crash-1",
    severity: "high",
    category: "Runtime Crash Risk",
    title: "Unhandled TypeError on inactive session token issuance",
    description:
      "issueSessionToken returns null when account is inactive, causing unhandled runtime exception in loginUser().",
    filePath: "src/services/auth.ts",
    line: 28,
    repoId: "sample-project",
    actionText: "Inspect Stack Trace",
    href: "/debug?repoId=sample-project&inv=inv_demo_1",
  },
  {
    id: "att-debt-1",
    severity: "warning",
    category: "Technical Debt",
    title: "Cyclomatic complexity in loginUser() exceeds threshold (12 > 10)",
    description:
      "Multi-branch MFA control flow exceeds cyclomatic threshold. Recommended extract-method refactoring proposal ready.",
    filePath: "src/services/auth.ts",
    line: 14,
    repoId: "sample-project",
    actionText: "Apply Refactoring",
    href: "/refactoring?repoId=sample-project",
  },
];

export function NeedsAttentionSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-sm"
      }`}
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Needs Attention
              </h2>
              <span className="text-[11px] font-mono font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                3 critical findings
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              High-priority security vulnerabilities, stack trace exceptions, and quality debt requiring engineering remediation.
            </p>
          </div>
        </div>

        <Link
          href="/code-review?repoId=sample-project&pr=101"
          aria-label="View all review findings"
          className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-md px-1"
        >
          <span>View all findings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3 Actionable Cards Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {ATTENTION_ITEMS.map((item) => {
          const isCritical = item.severity === "critical";
          const isHigh = item.severity === "high";

          const badgeClass = isCritical
            ? "bg-rose-500/10 text-rose-500 border-rose-500/25"
            : isHigh
            ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
            : "bg-purple-500/10 text-purple-400 border-purple-500/25";

          const IconComponent = isCritical
            ? ShieldAlert
            : isHigh
            ? AlertTriangle
            : Wrench;

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between p-4.5 rounded-xl border transition-all duration-200 ${
                isDark
                  ? "bg-[#111726]/60 border-[#242B39] hover:border-[#7C5CFC]/50 hover:bg-[#111726]"
                  : "bg-[#F9FAFB] border-[#E8E5F4] hover:border-[#7C5CFC]/40 hover:bg-white shadow-2xs"
              }`}
            >
              <div>
                {/* Severity Badge & File Location */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${badgeClass}`}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span>{item.severity}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] truncate">
                    <FileCode className="w-3 h-3 text-[var(--primary)]" />
                    <span className="truncate">{item.filePath}:{item.line}</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] leading-snug">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-[var(--border-color)]/60 flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-secondary)] font-medium">
                  {item.category}
                </span>

                <Link
                  href={item.href}
                  aria-label={`${item.actionText} for ${item.title}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#7C5CFC] hover:bg-[#6847F0] shadow-sm active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C5CFC]"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
