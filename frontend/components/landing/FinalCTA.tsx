"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Sparkles, LogIn } from "lucide-react";

export function FinalCTA() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-color)] bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-elevated)] p-8 sm:p-12 lg:p-16 shadow-lg text-center space-y-6">
        {/* Glow ambient circle */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-96 rounded-full bg-gradient-to-r from-[#7C5CFC]/20 via-[#3B65FF]/20 to-[#22D3EE]/20 blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3.5 py-1.5 font-mono text-xs font-bold text-[var(--primary)] shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>START INVESTIGATING TODAY</span>
          </div>

          <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-[var(--text-primary)]">
            Your next codebase, fully understood.
          </h2>

          <p className="text-base sm:text-lg font-medium text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Start exploring code structure, dependencies, and architecture with CodeAtlas.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] bg-gradient-to-r from-[#7C5CFC] to-[#5A38E6] hover:from-[#6A4BE8] hover:to-[#4A28D6] shadow-[0_0_24px_-6px_rgba(124,92,252,0.45)]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--border-color)]/25 hover:border-[var(--primary)]/60 hover:text-[var(--primary)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] text-[var(--text-primary)] shadow-xs"
            >
              <LogIn className="w-4 h-4 text-[var(--text-secondary)]" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
