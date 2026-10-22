"use client";

import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import City from "@/components/City";
import { useTheme } from "@/components/ThemeProvider";
import {
  ScanSearch,
  Sparkles,
  Plus,
  CheckCircle2,
  Circle,
  ArrowRight,
  ExternalLink,
  Layers,
  Database,
  RefreshCw,
} from "lucide-react";
import { Github } from "@/components/Icons";

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Prototype checklist state
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);
  const [hasSampleRepo, setHasSampleRepo] = useState(false);

  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(completedSteps.filter((i) => i !== index));
    } else {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  const steps = [
    { title: "Add a repository or paste a snippet", href: "/repositories" },
    { title: "Wait for analysis to finish", href: "/repositories" },
    { title: "Ask your first question", href: "/assistant" },
  ];

  return (
    <div>
      <PageHeader
        title="Welcome to CodeAtlas"
        sub="What would you like to understand today?"
      />

      {/* 3 Quick Action Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Connect GitHub */}
        <Link
          href="/repositories"
          className={`group rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 ${
            isDark
              ? "bg-[#0D111B] border border-[#242B39] hover:border-[#29D3C2]/50 hover:shadow-[0_0_20px_-5px_rgba(41,211,194,0.2)]"
              : "bg-sunsoft border border-[#E8E5F4] shadow-soft hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md ${
                isDark
                  ? "bg-[#29D3C2]/15 text-[#29D3C2]"
                  : "bg-white/80 text-[#19143D]"
              }`}
            >
              {isDark ? "START HERE" : "CONNECT"}
            </span>
            <Github className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">Connect GitHub</h2>
          <p className="mt-1.5 text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
            {isDark
              ? "Pick a repository and start analysis."
              : "Choose a repo and we build its city."}
          </p>
        </Link>

        {/* Card 2: Explore code from an image */}
        <Link
          href="/visual-code-explorer"
          className={`group rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 ${
            isDark
              ? "bg-[#0D111B] border border-[#242B39] hover:border-[#8B7CFF]/50 hover:shadow-[0_0_20px_-5px_rgba(139,124,255,0.2)]"
              : "bg-lilac border border-[#E8E5F4] shadow-soft hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md ${
                isDark
                  ? "bg-[#8B7CFF]/15 text-[#8B7CFF]"
                  : "bg-white/80 text-[#6C4DFF]"
              }`}
            >
              {isDark ? "VISUAL" : "CODELENS"}
            </span>
            <ScanSearch className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">Explore code from an image</h2>
          <p className="mt-1.5 text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
            Paste, upload or capture code.
          </p>
        </Link>

        {/* Card 3: Ask AI about code */}
        <Link
          href="/assistant"
          className={`group rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 ${
            isDark
              ? "bg-[#0D111B] border border-[#242B39] hover:border-[#2FD6A0]/50 hover:shadow-[0_0_20px_-5px_rgba(47,214,160,0.2)]"
              : "bg-mintsoft border border-[#E8E5F4] shadow-soft hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md ${
                isDark
                  ? "bg-[#2FD6A0]/15 text-[#2FD6A0]"
                  : "bg-white/80 text-[#1BA97B]"
              }`}
            >
              {isDark ? "ASK" : "ASSISTANT"}
            </span>
            <Sparkles className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--primary)] transition-colors" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">Ask AI about code</h2>
          <p className="mt-1.5 text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
            Sourced answers about a repository.
          </p>
        </Link>
      </div>

      {/* Main Grid: Your city / Your atlas & Getting started */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Left Panel: Your City / Your Atlas */}
        <section
          className={`app-card p-6 sm:p-8 flex flex-col justify-between ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {isDark ? "Your atlas" : "Your city"}
                </h2>
                <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                  {hasSampleRepo
                    ? "my-project · Live repository preview (Sample content)"
                    : isDark
                    ? "No repositories yet. Add one and its map, indexing status and recent questions appear here."
                    : "No repositories yet. Add one to start building."}
                </p>
              </div>

              {/* Sample Toggle Button */}
              <button
                onClick={() => setHasSampleRepo(!hasSampleRepo)}
                className="text-xs font-mono font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {hasSampleRepo ? "Show Empty State" : "Load Sample Repo"}
              </button>
            </div>

            {/* Illustration / Empty State Area */}
            {hasSampleRepo ? (
              <div className="mt-6 rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-page)] p-4">
                <City className="w-full h-56" />
                <div className="mt-3 flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                  <span>6 indexed symbols · 12 call links</span>
                  <Link
                    href="/architecture"
                    className="text-[var(--primary)] hover:underline font-bold flex items-center gap-1"
                  >
                    Open Full Graph <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                href="/repositories"
                aria-label="Add repository"
                className={`relative mx-auto mt-8 grid h-52 max-w-md place-items-center rounded-2xl border-2 border-dashed transition-all group ${
                  isDark
                    ? "border-[#242B39] bg-[#0A0F19]/60 hover:border-[#29D3C2]/50 hover:bg-[#111725]/40"
                    : "border-[#BDB2FF]/60 bg-[#F3F1FF]/60 hover:border-[#6C4DFF] hover:bg-[#F3F1FF]"
                }`}
              >
                {/* Isometric Grid Illusion */}
                <svg viewBox="0 0 440 190" className="absolute inset-0 h-full w-full opacity-40">
                  <polygon
                    points="220,10 430,95 220,180 10,95"
                    fill="none"
                    stroke={isDark ? "#29D3C2" : "#6C4DFF"}
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                  />
                  <polygon
                    points="220,40 370,95 220,150 70,95"
                    fill="none"
                    stroke={isDark ? "#8B7CFF" : "#BDB2FF"}
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                </svg>

                <div className="relative text-center">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-full text-2xl font-bold shadow-md mx-auto transition-transform group-hover:scale-110 ${
                      isDark
                        ? "bg-[#29D3C2] text-[#070A12]"
                        : "bg-[#6C4DFF] text-white"
                    }`}
                  >
                    <Plus className="w-6 h-6" />
                  </span>
                  <span className="mt-3 block text-sm font-bold text-[var(--text-primary)]">
                    Add repository
                  </span>
                </div>
              </Link>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Supported: GitHub, ZIP archives, Single files</span>
            <Link href="/repositories" className="font-semibold text-[var(--primary)] hover:underline">
              Manage Repositories &rarr;
            </Link>
          </div>
        </section>

        {/* Right Panel: Getting Started Checklist */}
        <section
          className={`app-card p-6 sm:p-8 flex flex-col justify-between ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Getting started
              </h2>
              <span className="font-mono text-sm font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full">
                {completedSteps.length} / 3
              </span>
            </div>

            {/* Progress Bar */}
            <div className="my-5 h-2.5 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDark ? "bg-[#29D3C2]" : "bg-[#6C4DFF]"
                }`}
                style={{ width: `${(completedSteps.length / 3) * 100}%` }}
              />
            </div>

            {/* Steps List */}
            <ul className="space-y-4">
              {steps.map((s, idx) => {
                const isChecked = completedSteps.includes(idx);
                return (
                  <li
                    key={s.title}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isChecked
                        ? isDark
                          ? "bg-[#111725]/60 border-[#242B39]/80 text-[#F3F5FA]"
                          : "bg-[#FAF9FF] border-[#E8E5F4] text-[#19143D]"
                        : isDark
                        ? "bg-[#0A0F19]/40 border-[#242B39]/40 text-[#9AA4B5]"
                        : "bg-white border-[#E8E5F4]/60 text-[#68677D]"
                    }`}
                  >
                    <button
                      onClick={() => toggleStep(idx)}
                      className="flex items-center gap-3.5 text-left flex-1"
                      aria-label={`Toggle step ${s.title}`}
                    >
                      {isChecked ? (
                        <CheckCircle2
                          className={`w-5 h-5 shrink-0 ${
                            isDark ? "text-[#29D3C2]" : "text-[#6C4DFF]"
                          }`}
                        />
                      ) : (
                        <Circle className="w-5 h-5 shrink-0 text-[var(--text-secondary)]/50" />
                      )}
                      <span
                        className={`text-sm font-semibold ${
                          isChecked ? "line-through opacity-70" : ""
                        }`}
                      >
                        {s.title}
                      </span>
                    </button>

                    <Link
                      href={s.href}
                      className="text-xs font-bold text-[var(--primary)] hover:underline ml-2"
                    >
                      Start
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-8 rounded-2xl p-4 bg-[var(--bg-page)] border border-[var(--border-color)]">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              <span>Pro Tip</span>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
              Snap a screenshot of any function in your terminal or IDE, then paste it into Visual Code Explorer to trace its callers.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
