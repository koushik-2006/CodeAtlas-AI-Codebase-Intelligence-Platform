"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  GitBranch,
  Network,
  PlayCircle,
  Sparkles,
  RefreshCw,
  FileCode,
  Layers,
} from "lucide-react";
import { MermaidFlowchart } from "./MermaidFlowchart";
import { ExecutionTracePlayer } from "./ExecutionTracePlayer";
import {
  BUGGY_SNIPPET,
  SAMPLE_SNIPPETS,
  analyzeSnippetOffline,
} from "@/lib/demo/explorer-engine";
import { aiService } from "@/services/ai-service";

interface VisualizeWorkspaceProps {
  initialCode?: string;
  initialLanguage?: string;
}

export function VisualizeWorkspace({
  initialCode,
  initialLanguage = "typescript",
}: VisualizeWorkspaceProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeSubTab, setActiveSubTab] = useState<
    "flowchart" | "sequence" | "step-through"
  >("flowchart");

  const [code, setCode] = useState<string>(
    initialCode || SAMPLE_SNIPPETS.buggy.code
  );
  const [language, setLanguage] = useState<string>(initialLanguage);

  // Dynamic diagrams state
  const [isGenerating, setIsGenerating] = useState(false);
  const [flowchartText, setFlowchartText] = useState<string>(() => {
    const offline = analyzeSnippetOffline(code, language);
    return offline.localFlowchart;
  });
  const [sequenceText, setSequenceText] = useState<string>(() => {
    const offline = analyzeSnippetOffline(code, language);
    return offline.localSequenceDiagram;
  });

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      if (activeSubTab === "flowchart") {
        const res = await aiService.generateMermaidFlowchart(code, language);
        setFlowchartText(res);
      } else if (activeSubTab === "sequence") {
        const res = await aiService.generateMermaidSequenceDiagram(code, language);
        setSequenceText(res);
      }
    } catch {
      // Local fallbacks already configured
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Navigation Subtabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
        <div className="flex flex-wrap items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === "flowchart"}
            onClick={() => setActiveSubTab("flowchart")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "flowchart"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Control Flowchart</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === "sequence"}
            onClick={() => setActiveSubTab("sequence")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "sequence"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Sequence Diagram</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === "step-through"}
            onClick={() => setActiveSubTab("step-through")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "step-through"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>Step-Through Trace Player</span>
          </button>
        </div>

        {/* Snippet Picker for Visualization */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-[var(--text-secondary)]">Snippet:</span>
          <select
            value={code === SAMPLE_SNIPPETS.buggy.code ? "buggy" : "other"}
            onChange={(e) => {
              const k = e.target.value;
              if (SAMPLE_SNIPPETS[k]) {
                const s = SAMPLE_SNIPPETS[k];
                setCode(s.code);
                setLanguage(s.language);
                const off = analyzeSnippetOffline(s.code, s.language);
                setFlowchartText(off.localFlowchart);
                setSequenceText(off.localSequenceDiagram);
              }
            }}
            className={`py-1 px-2.5 rounded-lg border text-xs font-semibold outline-none ${
              isDark
                ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                : "bg-white border-[#E8E5F4] text-[#1E2022]"
            }`}
          >
            <option value="buggy">Buggy Discount Calculator (TS)</option>
            <option value="typescript">Authentication Service (TS)</option>
            <option value="python">FastAPI Metrics Router (Python)</option>
            <option value="java">Payment Processor (Java)</option>
            <option value="go">Concurrent Job Pool (Go)</option>
            <option value="sql">LTV Customer Analytics (SQL)</option>
          </select>
        </div>
      </div>

      {/* Subtab 1: Flowchart */}
      {activeSubTab === "flowchart" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Control Flow Graph
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Visualizes conditional branching, decision nodes, and exit states.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)]/20 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span>Regenerate with AI</span>
            </button>
          </div>
          <MermaidFlowchart chart={flowchartText} isDark={isDark} />
        </div>
      )}

      {/* Subtab 2: Sequence Diagram */}
      {activeSubTab === "sequence" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Component Call & Message Sequence
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Depicts message interchanges between callers, services, and database layers.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)]/20 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span>Regenerate with AI</span>
            </button>
          </div>
          <MermaidFlowchart chart={sequenceText} isDark={isDark} />
        </div>
      )}

      {/* Subtab 3: Step-Through Trace Player */}
      {activeSubTab === "step-through" && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              Interactive Execution Trace Player
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Step forward and backward through line-by-line execution state with variable inspection and console telemetry.
            </p>
          </div>
          <ExecutionTracePlayer code={code} language={language} />
        </div>
      )}
    </div>
  );
}
