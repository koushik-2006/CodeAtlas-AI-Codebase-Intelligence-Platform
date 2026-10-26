"use client";

import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import { GitPullRequest, SearchCode, Compass } from "lucide-react";

export function HowItWorks() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const steps = [
    {
      num: "01",
      title: "Connect",
      desc: "Connect GitHub or start with a supported code sample.",
      icon: GitPullRequest,
      badgeLight: "bg-[#FFF0BF] text-[#1E2022] border-[#FCE18F]", // soft yellow
      badgeDark: "bg-[#29D3C2]/15 text-[#29D3C2] border-[#29D3C2]/30",
    },
    {
      num: "02",
      title: "Analyze",
      desc: "Explore available files, symbols, and code relationships.",
      icon: SearchCode,
      badgeLight: "bg-[#D7F7EA] text-[#1E2022] border-[#B9EED8]", // soft mint
      badgeDark: "bg-[#8B7CFF]/15 text-[#8B7CFF] border-[#8B7CFF]/30",
    },
    {
      num: "03",
      title: "Understand",
      desc: "Ask questions, trace workflows, and investigate potential changes.",
      icon: Compass,
      badgeLight: "bg-[#FFE0E3] text-[#1E2022] border-[#FCC5CB]", // soft coral
      badgeDark: "bg-[#F3C969]/15 text-[#F3C969] border-[#F3C969]/30",
    },
  ];

  return (
    <section id="steps" className="mx-auto max-w-6xl px-5 py-20 scroll-mt-16">
      <div className="text-center max-w-2xl mx-auto">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Workflow
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl text-[var(--text-primary)]">
          {isDark ? "Connect. Analyze. Understand." : "Three steps to your first map"}
        </h2>
      </div>

      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <motion.li
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              key={s.num}
              className={`rounded-2xl border p-8 transition-all duration-300 shadow-sm ${
                isDark
                  ? "bg-[#161B22] border-[#30363D] hover:border-[#29D3C2]/50 hover:shadow-[0_0_24px_-4px_rgba(41,211,194,0.12)]"
                  : "bg-white border-[#E5E5E0] hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-lg font-mono text-xs font-bold border ${
                    isDark ? s.badgeDark : s.badgeLight
                  }`}
                >
                  {s.num} — {s.title}
                </span>
                <div
                  className={`p-2 rounded-xl ${
                    isDark ? "text-[#29D3C2]" : "text-[#6C4DFF]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <h3 className="mt-6 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                {s.desc}
              </p>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
