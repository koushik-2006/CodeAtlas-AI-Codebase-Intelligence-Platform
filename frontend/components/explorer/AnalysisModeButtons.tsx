"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  Sparkles,
  Bug,
  Zap,
  MessageSquareCode,
  ArrowRightLeft,
  CheckSquare,
  Network,
  ListOrdered,
  ChevronDown,
  FolderGit2,
  Gauge,
  ShieldAlert,
  GitBranch,
} from "lucide-react";
import { CodeAnalysisMode } from "@/services/ai-service";
import { useRepositories } from "@/hooks/useRepositories";

interface AnalysisModeButtonsProps {
  disabled: boolean;
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
  onRunAnalysis: (mode: CodeAnalysisMode, targetLanguage?: string) => void;
  onGenerateFlowchart: () => void;
  activeMode?: string | null;
  isAnalyzing?: boolean;
}

const TARGET_LANGUAGES = [
  "Python",
  "TypeScript",
  "Go",
  "Rust",
  "Java",
  "C#",
  "SQL",
];

export function AnalysisModeButtons({
  disabled,
  selectedRepo,
  onRepoChange,
  onRunAnalysis,
  onGenerateFlowchart,
  activeMode,
  isAnalyzing = false,
}: AnalysisModeButtonsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { repositories } = useRepositories();
  const [targetLang, setTargetLang] = useState<string>("Python");
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);

  const modes: Array<{
    id: CodeAnalysisMode;
    label: string;
    description: string;
    icon: any;
    color: string;
  }> = [
    {
      id: "explain",
      label: "Explain simply",
      description: "Plain English summary of intent, inputs, state, and outputs",
      icon: Sparkles,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      id: "line-by-line",
      label: "Line-by-line",
      description: "Detailed walkthrough of mechanical execution block by block",
      icon: ListOrdered,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      id: "find-bugs",
      label: "Find bugs",
      description: "Detect edge-cases, null errors, memory leaks, and vulnerabilities",
      icon: Bug,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    {
      id: "optimize",
      label: "Optimize",
      description: "Big-O complexity, bottleneck elimination, and speed improvements",
      icon: Zap,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "add-comments",
      label: "Add comments",
      description: "Production JSDoc / docstrings with annotated reasoning",
      icon: MessageSquareCode,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "convert",
      label: `Convert to ${targetLang}`,
      description: "Transform idiomatic syntax and standard library patterns",
      icon: ArrowRightLeft,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      id: "generate-tests",
      label: "Generate tests",
      description: "Unit test suite with boundary and error assertion coverage",
      icon: CheckSquare,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      id: "complexity",
      label: "Complexity analysis",
      description: "Cyclomatic complexity, Halstead metrics, and time/space Big-O",
      icon: Gauge,
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    },
    {
      id: "security",
      label: "Security check",
      description: "OWASP Top 10 vulnerabilities, CWE identification, taint audit",
      icon: ShieldAlert,
      color: "text-red-400 bg-red-500/10 border-red-500/20",
    },
  ];

  return (
    <div className="p-5 border-t border-[var(--border-color)] space-y-4">
      {/* Target Repo & Context Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-[var(--primary)]" />
          <span className="font-bold text-[var(--text-primary)]">
            Repository Context:
          </span>
          <select
            value={selectedRepo}
            onChange={(e) => onRepoChange(e.target.value)}
            className={`py-1 px-2.5 rounded-lg text-xs font-semibold border outline-none cursor-pointer ${
              isDark
                ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                : "bg-white border-[#E5E5E0] text-[#1E2022]"
            }`}
          >
            {repositories.length > 0 ? (
              repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name} ({repo.status === "ready" ? `${repo.symbolCount || 0} symbols` : repo.status})
                </option>
              ))
            ) : (
              <option value="sample-project">sample-project (Indexed)</option>
            )}
            <option value="none">— Standalone snippet (No repo) —</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={onGenerateFlowchart}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              activeMode === "flowchart" && isAnalyzing
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Generate Flowchart</span>
          </button>
        </div>
      </div>

      {/* 9 Analysis Modes Grid */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id && isAnalyzing;

          if (m.id === "convert") {
            return (
              <div key={m.id} className="relative group">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRunAnalysis("convert", targetLang)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[92px] ${
                    isActive
                      ? "ring-2 ring-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]"
                      : isDark
                      ? "bg-[#0D1117] border-[#242B39] hover:border-[#384358] hover:bg-[#111726]"
                      : "bg-[#FAF9FF] border-[#E8E5F4] hover:border-[#C4B5FD] hover:bg-[#F3E8FF]"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl border ${m.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-[var(--text-primary)]">
                        {m.label}
                      </span>
                    </div>

                    {/* Language selector toggle */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLangMenu(!showLangMenu);
                      }}
                      className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-page)]"
                      title="Select conversion target language"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2">
                    {m.description}
                  </p>
                </button>

                {/* Target Language Dropdown Menu */}
                {showLangMenu && (
                  <div
                    className={`absolute right-2 top-10 z-30 w-36 py-1.5 rounded-xl border shadow-xl ${
                      isDark ? "bg-[#161B22] border-[#30363D]" : "bg-white border-[#E8E5F4]"
                    }`}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-[var(--text-secondary)]">
                      Target Language:
                    </div>
                    {TARGET_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetLang(lang);
                          setShowLangMenu(false);
                          if (!disabled) onRunAnalysis("convert", lang);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-[var(--primary)]/15 hover:text-[var(--primary)] flex items-center justify-between ${
                          targetLang === lang ? "text-[var(--primary)] font-bold" : "text-[var(--text-primary)]"
                        }`}
                      >
                        <span>{lang}</span>
                        {targetLang === lang && <span className="text-[10px]">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => onRunAnalysis(m.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[92px] ${
                isActive
                  ? "ring-2 ring-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]"
                  : isDark
                  ? "bg-[#0D1117] border-[#242B39] hover:border-[#384358] hover:bg-[#111726]"
                  : "bg-[#FAF9FF] border-[#E8E5F4] hover:border-[#C4B5FD] hover:bg-[#F3E8FF]"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-1.5 rounded-xl border ${m.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-[var(--text-primary)]">
                  {m.label}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2">
                {m.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
