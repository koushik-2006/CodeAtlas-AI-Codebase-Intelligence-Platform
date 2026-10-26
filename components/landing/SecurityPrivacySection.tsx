"use client";

import { useTheme } from "@/hooks/useTheme";
import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2 } from "lucide-react";

export function SecurityPrivacySection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const guarantees = [
    {
      icon: EyeOff,
      title: "Zero Model Training",
      desc: "Your proprietary repository source code is never used to train public language models. Code retrieval prompts use ephemeral context windows.",
    },
    {
      icon: Lock,
      title: "Local & Isolated Data Storage",
      desc: "Repository indexes, symbol tables, and knowledge graphs reside in isolated local storage partitioned strictly by authenticated user IDs.",
    },
    {
      icon: ShieldCheck,
      title: "Automatic Secret Redaction",
      desc: "GitHub tokens, bearer credentials, and API keys are automatically replaced with [REDACTED_SECRET] before entering logs or prompt payloads.",
    },
    {
      icon: FileText,
      title: "Fact vs. Heuristic Delineation",
      desc: "CodeAtlas explicitly tags every relationship as AST-proven or heuristic. We never claim runtime execution order from static code structure alone.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 scroll-mt-16">
      <div className="p-8 sm:p-12 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 font-mono text-xs font-bold text-green-600 dark:text-green-400 border border-green-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Grounded in Real Code</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-[var(--text-primary)]">
            Privacy &amp; Security You Can Audit
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Enterprise-grade protections enforced directly at the architectural level.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {guarantees.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)]/70 space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    {g.title}
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {g.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
