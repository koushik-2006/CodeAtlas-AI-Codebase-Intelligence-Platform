"use client";

import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2, Cpu, Code2, Database } from "lucide-react";

export function SecurityPrivacySection() {
  const verifiedTech = [
    { name: "Next.js 14", desc: "React Framework & App Router" },
    { name: "React 18", desc: "Component Architecture" },
    { name: "TypeScript", desc: "Strict Type Safety" },
    { name: "Deterministic AST", desc: "Call-Tree Parsing Engine" },
    { name: "GitHub API", desc: "Authorized Read-Only OAuth" },
    { name: "Local Isolation", desc: "Partitioned User Storage" },
  ];

  const trustGuarantees = [
    {
      icon: Lock,
      title: "Permission-Based Repository Access",
      desc: "CodeAtlas operates strictly within the permissions you explicitly grant. We request read-only access for authorized repositories and never attempt to access private code without explicit OAuth authorization.",
      tag: "Zero Overreach",
    },
    {
      icon: EyeOff,
      title: "Zero Model Training on Code",
      desc: "Your proprietary repository source code is never used to train or fine-tune public foundation models. AI assistant queries use ephemeral prompt context windows that are not retained.",
      tag: "Private Context",
    },
    {
      icon: Database,
      title: "Isolated Local Data Storage",
      desc: "Repository indexes, symbol tables, and knowledge graphs reside in isolated local workspace storage partitioned strictly by authenticated user sessions.",
      tag: "Local Partitioning",
    },
    {
      icon: ShieldCheck,
      title: "Automatic Secret Redaction",
      desc: "Personal access tokens, private keys, bearer credentials, and webhook secrets are automatically redacted to [REDACTED_SECRET] before entering logs or analysis payloads.",
      tag: "Credential Safe",
    },
    {
      icon: FileText,
      title: "Fact vs. Heuristic Delineation",
      desc: "CodeAtlas transparently tags every relationship as AST-proven or heuristic. We never claim runtime execution certainty from static source structure alone.",
      tag: "Honest Analysis",
    },
    {
      icon: Cpu,
      title: "Deterministic Static Analysis",
      desc: "Our core parsing engine constructs Abstract Syntax Trees locally. File references, symbol definitions, and caller trees are computed mathematically from source code.",
      tag: "AST Grounded",
    },
  ];

  return (
    <section id="trust" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 scroll-mt-20">
      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 sm:p-10 lg:p-12 shadow-sm space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TECHNOLOGY &amp; PLATFORM TRUST</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--text-primary)]">
            Engineering Rigor and Transparent Privacy
          </h2>
          <p className="text-base text-[var(--text-secondary)]">
            Built with modern web technologies and architectural safeguards that keep your proprietary codebase secure.
          </p>
        </div>

        {/* Verified Tech Stack Strip */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)]/80 p-5">
          <div className="text-center mb-4">
            <span className="font-mono text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Verified Technical Foundation
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {verifiedTech.map((tech) => (
              <div
                key={tech.name}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 space-y-1 shadow-xs"
              >
                <div className="font-mono font-bold text-xs text-[var(--text-primary)]">
                  {tech.name}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">
                  {tech.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Guarantees Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trustGuarantees.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)]/60 p-6 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
