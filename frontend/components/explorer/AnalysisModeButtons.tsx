"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  Sparkles,
  GitBranch,
  FolderGit2,
  Bug,
  Zap,
  MessageSquareCode,
  ArrowRightLeft,
  CheckSquare,
  Network,
  ListOrdered,
  ChevronDown,
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

const TARGET_LANGUAGES = ["Python", "TypeScript", "Go", "Rust", "Java", "C++", "SQL"];

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
  ];

  return (
    <div className="p-5 border-t border-[var(--border-color)] space-y-4">
      {/* Target Repo & Context Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-[var(--primary)]" />
          <span className="font-bold text-[var(--text-primary)]">Target Repository Context:</span>
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
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">
            Powered by Firebase AI Logic · Gemini Flash
          </span>
        </div>
      </div>

      {/* Analysis Modes Grid (7 buttons) + Visual Flowchart Button */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id && isAnalyzing;

          if (m.id === "convert") {
            return (
              <div key={m.id} className="relative group">
                <button
                  type="button"
                  onClick={() => onRunAnalysis("convert", targetLang)}
                  disabled={disabled || isAnalyzing}
                  className={`w-full p-3 rounded-2xl font-bold text-left transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                    isActive
                      ? "ring-2 ring-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]"
                      : isDark
                      ? "bg-[#0A0F19] border-[#242B39] hover:border-[var(--primary)]/60 hover:bg-[#111725]"
                      : "bg-white border-[#E8E5F4] hover:border-[var(--primary)]/60 hover:bg-[#FAF9FF] shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${m.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {m.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLangMenu((prev) => !prev);
                      }}
                      className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)]"
                      title="Choose target language"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed line-clamp-1">
                    {m.description}
                  </p>
                </button>

                {showLangMenu && (
                  <div
                    className={`absolute bottom-full mb-1 left-0 right-0 z-20 p-1.5 rounded-xl border shadow-lg ${
                      isDark ? "bg-[#111725] border-[#242B39]" : "bg-white border-[#E8E5F4]"
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase px-2 py-1 font-bold text-[var(--text-secondary)] block">
                      Target Language:
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {TARGET_LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => {
                            setTargetLang(lang);
                            setShowLangMenu(false);
                          }}
                          className={`px-2 py-1 text-left text-xs rounded-lg font-medium transition-colors ${
                            targetLang === lang
                              ? "bg-[var(--primary)] text-white font-bold"
                              : "hover:bg-[var(--primary)]/10 text-[var(--text-primary)]"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onRunAnalysis(m.id)}
              disabled={disabled || isAnalyzing}
              className={`p-3 rounded-2xl font-bold text-left transition-all border disabled:opacity-40 disabled:cursor-not-allowed group ${
                isActive
                  ? "ring-2 ring-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]"
                  : isDark
                  ? "bg-[#0A0F19] border-[#242B39] hover:border-[var(--primary)]/60 hover:bg-[#111725]"
                  : "bg-white border-[#E8E5F4] hover:border-[var(--primary)]/60 hover:bg-[#FAF9FF] shadow-xs"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1.5 rounded-lg border ${m.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {m.label}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed line-clamp-1">
                {m.description}
              </p>
            </button>
          );
        })}

        {/* Visual Control Flow (Mermaid Flowchart) */}
        <button
          type="button"
          onClick={onGenerateFlowchart}
          disabled={disabled || isAnalyzing}
          className={`p-3 rounded-2xl font-bold text-left transition-all border disabled:opacity-40 disabled:cursor-not-allowed group ${
            activeMode === "flowchart" && isAnalyzing
              ? "ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500"
              : isDark
              ? "bg-[#0A0F19] border-[#242B39] hover:border-emerald-500/60 hover:bg-[#111725]"
              : "bg-white border-[#E8E5F4] hover:border-emerald-500/60 hover:bg-[#FAF9FF] shadow-xs"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-lg border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
              <Network className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)]">
              Visual Flowchart
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed line-clamp-1">
            Generate Mermaid control flow diagram
          </p>
        </button>
      </div>
    </div>
  );
}
