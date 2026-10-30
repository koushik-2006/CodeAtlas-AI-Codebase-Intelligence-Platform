"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, ShieldCheck, Zap, GitFork, CheckCircle2 } from "lucide-react";
import { HeroVisualization } from "./HeroVisualization";

export function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[450px] w-[650px] rounded-full bg-gradient-to-tr from-[#7C5CFC]/15 via-[#3B65FF]/10 to-[#22D3EE]/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Headlines & Action Area */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-6 text-left">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/25 bg-[var(--primary)]/10 px-3.5 py-1.5 font-mono text-xs font-bold text-[var(--primary)] shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]" />
              </span>
              <span>AI-POWERED CODEBASE INTELLIGENCE</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-[56px] leading-[1.08] text-[var(--text-primary)]">
              Understand any codebase.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C5CFC] via-[#3B65FF] to-[#22D3EE]">
                Trace every connection.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="max-w-xl text-base sm:text-lg font-medium text-[var(--text-secondary)] leading-relaxed">
              Explore unfamiliar repositories, understand architecture, trace caller and callee relationships, and investigate code with evidence-backed AI insights.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] bg-gradient-to-r from-[#7C5CFC] via-[#6342E8] to-[#4A28D6] hover:from-[#6A4BE8] hover:to-[#3F1EB5] shadow-[0_0_28px_-6px_rgba(124,92,252,0.5)]"
              >
                <span>Explore CodeAtlas</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--border-color)]/25 hover:border-[var(--primary)]/60 hover:text-[var(--primary)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] text-[var(--text-primary)] shadow-xs"
              >
                <span>See How It Works</span>
              </a>
            </div>

            {/* Concise Trust Indicators */}
            <div className="pt-4 border-t border-[var(--border-color)]/80 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-mono text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Deterministic AST Call Trees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span>Zero Training On Code</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>Source-Verified Receipts</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Codebase Visualization */}
          <div className="lg:col-span-6 xl:col-span-6 w-full">
            <HeroVisualization />
          </div>
        </div>
      </div>
    </section>
  );
}
