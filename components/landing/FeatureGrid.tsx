"use client";

import { useTheme } from "@/hooks/useTheme";
import { Eye, Sparkles, GitBranch, Layers, Search, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function FeatureGrid() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const featureCards = [
    {
      num: "01",
      title: "Visual Code Explorer",
      desc: "Paste, photograph, or upload code and explain the extracted snippet.",
      icon: Eye,
      span: "md:col-span-4",
      lightBg: "bg-[#EAE5FF] border-[#DDD5FE]", // soft violet
      darkTag: "OCR + CodeLens",
    },
    {
      num: "02",
      title: "AI with receipts",
      desc: "Ground answers in verifiable file and line references.",
      icon: Sparkles,
      span: "md:col-span-2",
      lightBg: "bg-[#FFE0E3] border-[#FCC5CB]", // soft coral
      darkTag: "Verifiable Sources",
    },
    {
      num: "03",
      title: "Architecture graph",
      desc: "Explore relationships between files, functions, APIs, and tests.",
      icon: GitBranch,
      span: "md:col-span-2",
      lightBg: "bg-[#D7F7EA] border-[#B9EED8]", // soft mint
      darkTag: "Call Hierarchies",
    },
    {
      num: "04",
      title: "Change impact",
      desc: "Discover potentially affected components.",
      icon: Layers,
      span: "md:col-span-2",
      lightBg: "bg-[#FFF0BF] border-[#FCE18F]", // soft yellow
      darkTag: "Blast Radius",
    },
    {
      num: "05",
      title: "Semantic search",
      desc: "Search a codebase using natural-language descriptions.",
      icon: Search,
      span: "md:col-span-2",
      lightBg: "bg-white border-[#E5E5E0]",
      darkTag: "Vector Index",
    },
    {
      num: "06",
      title: "Private by design",
      desc: "Communicate the actual repository-access and privacy behavior accurately.",
      icon: ShieldCheck,
      span: "md:col-span-4",
      lightBg: "bg-[#EAE5FF]/60 border-[#E5E5E0]",
      darkTag: "Zero Training",
    },
  ];

  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20 scroll-mt-16">
      <div className="max-w-2xl">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Capabilities
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-5xl text-[var(--text-primary)]">
          {isDark ? "Everything to navigate unfamiliar code" : "A city planner for your code"}
        </h2>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-6">
        {featureCards.map((feat) => {
          const Icon = feat.icon;
          return (
            <motion.article
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              key={feat.title}
              className={`${feat.span} rounded-2xl border p-7 transition-all duration-300 shadow-sm ${
                isDark
                  ? "bg-[#161B22] border-[#30363D] hover:border-[#29D3C2]/60 hover:shadow-[0_0_24px_-4px_rgba(41,211,194,0.15)]"
                  : `${feat.lightBg} hover:shadow-md`
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
                  {feat.num}
                </span>
                <div
                  className={`p-2.5 rounded-xl border ${
                    isDark
                      ? "bg-[#0D1117] border-[#30363D] text-[#29D3C2]"
                      : "bg-white/80 border-[#E5E5E0] text-[#6C4DFF]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <h3 className="mt-4 text-xl font-bold tracking-tight text-[var(--text-primary)]">
                {feat.title}
              </h3>
              <p className="mt-2 text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                {feat.desc}
              </p>

              {isDark && (
                <span className="mt-4 inline-block font-mono text-[10px] uppercase tracking-wider text-[#29D3C2] bg-[#29D3C2]/10 border border-[#29D3C2]/20 px-2.5 py-0.5 rounded-md">
                  {feat.darkTag}
                </span>
              )}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
