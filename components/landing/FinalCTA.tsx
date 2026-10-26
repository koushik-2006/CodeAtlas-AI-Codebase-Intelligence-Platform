"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section id="about" className="mx-auto max-w-6xl px-5 py-16 scroll-mt-16">
      <div
        className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-8 rounded-3xl p-10 md:p-14 border transition-all duration-300 ${
          isDark
            ? "bg-[#161B22] border-[#30363D] shadow-[0_0_40px_-10px_rgba(41,211,194,0.15)]"
            : "bg-[#1E2022] text-white border-transparent shadow-lg"
        }`}
      >
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-[#29D3C2]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for developers</span>
          </div>
          <h2 className="text-2xl font-extrabold leading-tight md:text-4xl text-white">
            For students, new hires and teams inheriting legacy code.
          </h2>
          <p className="mt-4 text-sm md:text-base font-medium text-white/70 leading-relaxed">
            Photograph snippets, map your entire repository architecture, and trace any symbol with verifiable file citations.
          </p>
        </div>

        <Link
          href="/login"
          className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm transition-all duration-200 active:scale-95 shadow-md shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
            isDark
              ? "bg-[#29D3C2] text-[#0E1116] hover:bg-[#22b5a6] shadow-[0_0_20px_-3px_rgba(41,211,194,0.4)]"
              : "bg-[#6C4DFF] text-white hover:bg-[#5838e6] shadow-[0_8px_20px_-4px_rgba(108,77,255,0.4)]"
          }`}
        >
          Get started
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
