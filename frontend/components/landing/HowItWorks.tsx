"use client";

import { GitPullRequest, SearchCode, Compass, ArrowRight, CheckCircle2, ShieldCheck, Cpu } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Connect",
      eyebrow: "Authentication & Authorization",
      desc: "Sign in and authorize access to a GitHub account when needed, or start immediately with a supported local code sample.",
      icon: GitPullRequest,
      accent: "text-purple-600 dark:text-purple-400",
      accentBg: "bg-purple-500/10 border-purple-500/20",
      features: [
        "Read-only repository access",
        "OAuth2 & Personal Access Token support",
        "No private repository access without permission",
      ],
    },
    {
      num: "02",
      title: "Analyze",
      eyebrow: "Deterministic AST Parsing",
      desc: "Inspect repository structure, files, symbols, and supported dependencies using deterministic Abstract Syntax Tree parsing.",
      icon: SearchCode,
      accent: "text-cyan-600 dark:text-cyan-400",
      accentBg: "bg-cyan-500/10 border-cyan-500/20",
      features: [
        "Full symbol and function hierarchy extraction",
        "Caller and callee relationship mapping",
        "Local vector embedding and index generation",
      ],
    },
    {
      num: "03",
      title: "Understand",
      eyebrow: "Interactive Graph & Evidence",
      desc: "Explore architecture, investigate caller/callee relationships, trace multi-tier workflows, and ask grounded questions with citations.",
      icon: Compass,
      accent: "text-emerald-600 dark:text-emerald-400",
      accentBg: "bg-emerald-500/10 border-emerald-500/20",
      features: [
        "Interactive 2D & 3D codebase visualization",
        "AI answers backed by exact file and line receipts",
        "Pre-commit change impact & blast-radius scoring",
      ],
    },
  ];

  return (
    <section id="how-it-works" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 scroll-mt-20">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3.5 py-1.5 font-mono text-xs font-bold text-[var(--primary)] shadow-xs">
          <span>THREE-STEP WORKFLOW</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-[var(--text-primary)]">
          How CodeAtlas Turns Code into Comprehension
        </h2>
        <p className="text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
          From connection to deep architectural clarity in three transparent, verifiable steps.
        </p>
      </div>

      {/* Connected Cards Timeline */}
      <div className="grid gap-6 md:grid-cols-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="relative rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-7 sm:p-8 shadow-xs hover:shadow-md hover:border-[var(--primary)]/40 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Step indicator top bar */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold border ${step.accentBg} ${step.accent}`}>
                    <span>Step {step.num}</span>
                  </span>
                  <div className={`p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] ${step.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
                    {step.eyebrow}
                  </span>
                  <h3 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    {step.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                  {step.desc}
                </p>

                {/* Sub-features list */}
                <ul className="space-y-2 pt-2 border-t border-[var(--border-color)]/60 text-xs font-medium text-[var(--text-secondary)]">
                  {step.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${step.accent}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
