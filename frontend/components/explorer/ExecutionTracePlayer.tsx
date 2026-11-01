"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
  Terminal,
  Variable,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { ExecutionTraceStep, generateExecutionTrace } from "@/lib/demo/explorer-engine";

interface ExecutionTracePlayerProps {
  code: string;
  language: string;
  onActiveLineChange?: (line: number) => void;
}

export function ExecutionTracePlayer({
  code,
  language,
  onActiveLineChange,
}: ExecutionTracePlayerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [steps, setSteps] = useState<ExecutionTraceStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5x, 1x, 2x

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Re-generate steps whenever code changes
  useEffect(() => {
    const generated = generateExecutionTrace(code, language);
    setSteps(generated);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [code, language]);

  const currentStep: ExecutionTraceStep | undefined = steps[currentStepIdx] || steps[0];

  // Notify parent of active line
  useEffect(() => {
    if (currentStep?.line && onActiveLineChange) {
      onActiveLineChange(currentStep.line);
    }
  }, [currentStepIdx, currentStep, onActiveLineChange]);

  // Autoplay ticker
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.round(1400 / playbackSpeed);
    timerRef.current = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, steps.length]);

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  const codeLines = code.split("\n");

  return (
    <div
      className={`rounded-3xl border overflow-hidden transition-all shadow-sm ${
        isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
      }`}
    >
      {/* Player Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-page)]/40">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-bold">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Interactive Step-Through Trace
            </h3>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              Step {currentStepIdx + 1} of {steps.length} · Line {currentStep?.line || 1}
            </span>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-2">
          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Reset trace to step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Prev */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
            title="Previous step"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={handleNext}
            disabled={currentStepIdx >= steps.length - 1}
            className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
            title="Next step"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-xs font-mono ml-1 border border-[var(--border-color)] rounded-xl p-0.5 bg-[var(--bg-card)]">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  playbackSpeed === spd
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Player Grid: Code on Left, Scope Variables & Console Log on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-color)]">
        {/* Left: Code Line Walkthrough with Active Line Highlighter */}
        <div className="lg:col-span-7 p-4 font-mono text-xs overflow-x-auto max-h-[380px] overflow-y-auto">
          {codeLines.map((rawLine, idx) => {
            const lineNum = idx + 1;
            const isCurrent = lineNum === currentStep?.line;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 px-2 py-0.5 rounded transition-colors ${
                  isCurrent
                    ? isDark
                      ? "bg-[var(--primary)]/20 border-l-2 border-[var(--primary)] font-bold text-white"
                      : "bg-[#6C4DFF]/15 border-l-2 border-[#6C4DFF] font-bold text-black"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-page)]/40"
                }`}
              >
                <span className="w-8 text-right select-none opacity-40 shrink-0">
                  {lineNum}
                </span>
                <span className="whitespace-pre truncate">{rawLine || " "}</span>
              </div>
            );
          })}
        </div>

        {/* Right: Reactive Variables Scope Table + Console Output */}
        <div className="lg:col-span-5 p-4 flex flex-col justify-between space-y-4 bg-[var(--bg-card)]/50">
          {/* Step Explanation Banner */}
          <div className="p-3 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)] space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--primary)] block">
              Step Explanation
            </span>
            <p className="text-xs text-[var(--text-primary)] leading-relaxed">
              {currentStep?.explanation || "Evaluating stack frame expression."}
            </p>
          </div>

          {/* Reactive Variables Table */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              <Variable className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Variables in Scope</span>
            </div>

            <div className="rounded-xl border border-[var(--border-color)] overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[var(--bg-page)] text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="p-2">Variable</th>
                    <th className="p-2">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {currentStep && currentStep.variables ? (
                    Object.entries(currentStep.variables).map(([key, val]) => (
                      <tr key={key} className="hover:bg-[var(--bg-page)]/30">
                        <td className="p-2 font-bold text-[var(--primary)]">{key}</td>
                        <td className="p-2 truncate max-w-[160px] text-[var(--text-primary)]">
                          {String(val)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-2 text-[var(--text-secondary)] text-center">
                        No active local variables
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Virtual Console Log Window */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)]">
              <Terminal className="w-3.5 h-3.5 text-emerald-500" />
              <span>Console Output</span>
            </div>
            <div
              className={`p-3 rounded-xl font-mono text-[11px] min-h-[64px] border overflow-x-auto ${
                isDark ? "bg-[#070A10] border-[#1C2230] text-emerald-400" : "bg-[#1E2022] text-emerald-300"
              }`}
            >
              {currentStep?.consoleOutput || "> [Process runtime active]"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
