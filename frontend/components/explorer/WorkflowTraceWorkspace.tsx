"use client";

import { useState, useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  GitBranch,
  Play,
  Sparkles,
  RefreshCw,
  FolderGit2,
  FileCode,
  ArrowRight,
  ListOrdered,
  Layers,
} from "lucide-react";
import { WorkflowTrace } from "./WorkflowTrace";
import { MermaidFlowchart } from "./MermaidFlowchart";
import {
  WorkflowTraceData,
  buildWorkflowCallChain,
} from "@/lib/demo/explorer-engine";
import { getStore } from "@/lib/demo/store";
import { aiService } from "@/services/ai-service";

export function WorkflowTraceWorkspace() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const store = getStore();
  const repositories = store.repositories || [];
  const [selectedRepoId, setSelectedRepoId] = useState<string>(
    repositories[0]?.id || "sample-project"
  );
  const [selectedEntryPoint, setSelectedEntryPoint] = useState<string>("auth_login");

  const [viewMode, setViewMode] = useState<"pipeline" | "flowchart">("pipeline");
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiNarration, setAiNarration] = useState<string | null>(null);

  const traceData: WorkflowTraceData = useMemo(() => {
    return buildWorkflowCallChain(selectedRepoId, selectedEntryPoint, store);
  }, [selectedRepoId, selectedEntryPoint, store]);

  // Mermaid chart representation of this workflow
  const mermaidChart = useMemo(() => {
    return `flowchart TD
  Client["📱 LoginForm.tsx\\n(Client Form Submit)"] --> Endpoint["🌐 handle_login()\\n(FastAPI Route)"]
  Endpoint --> Service["⚙️ loginUser()\\n(Auth Domain Service)"]
  Service --> DB[("🗄️ PostgreSQL\\ndb.users.findUnique")]
  Service --> Crypto["🔐 verifyPasswordHash()\\n(Argon2id Check)"]
  DB --> Service
  Crypto --> Service
  Service --> Token["🎟️ Issue Session JWT"]
  Token --> Client`;
  }, []);

  const handleExplainFlow = async () => {
    setIsExplaining(true);
    setAiNarration(null);

    try {
      const prompt = `Narrate and explain the following end-to-end software execution flow across architectural tiers:
Summary: ${traceData.summary}
Nodes:
${traceData.nodes.map((n: any) => `- [${n.nodeType}] ${n.label} in ${n.sourceFile}:${n.line || 1} -> ${n.description}`).join("\n")}`;

      const res = await aiService.explainCode({
        code: prompt,
        language: "typescript",
        mode: "explain",
      });
      setAiNarration(res);
    } catch {
      // Offline fallback narration
      setAiNarration(
        `### 🚀 End-to-End Execution Flow Narration\n\n1. **User Action (UI Tier):** The user enters their email and password in \`LoginForm.tsx\` and submits the form. Form state triggers validation.\n2. **Network Transport:** Inbound parameters are dispatched across the secure HTTPS boundary to the backend REST endpoint \`/api/auth/login\`.\n3. **Controller & Route Validation:** \`backend/routers/auth.py\` decodes JSON payloads and verifies required schema fields.\n4. **Domain Logic:** \`loginUser()\` in \`src/services/auth.ts\` coordinates verification, querying PostgreSQL for active accounts.\n5. **Cryptographic Validation:** Argon2id hash checks verify plaintext password against stored salt and hash parameters.\n6. **Session Creation:** A signed JWT token is returned with user authorization privileges.`
      );
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div
        className={`rounded-3xl border p-5 shadow-sm flex flex-wrap items-center justify-between gap-4 ${
          isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-bold">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
              End-to-End Workflow Call Chain Trace
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Trace execution paths from UI components down to API endpoints, services, and database queries.
            </p>
          </div>
        </div>

        {/* View Toggle & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 border border-[var(--border-color)] rounded-xl p-0.5 bg-[var(--bg-card)] text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode("pipeline")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "pipeline"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Linear Pipeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode("flowchart")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "flowchart"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Mermaid DAG
            </button>
          </div>

          {/* Explain this flow button */}
          <button
            type="button"
            onClick={handleExplainFlow}
            disabled={isExplaining}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isExplaining ? "animate-spin" : ""}`} />
            <span>{isExplaining ? "Narrating Flow..." : "Explain This Flow"}</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar: Pick Repository + Entry Point */}
      <div
        className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-4 text-xs ${
          isDark ? "bg-[#0A0E17] border-[#242B39]" : "bg-[#FAF9FF] border-[#E8E5F4]"
        }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-[var(--primary)]" />
            <span className="font-bold text-[var(--text-secondary)]">Repository:</span>
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className={`py-1.5 px-3 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
                isDark
                  ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                  : "bg-white border-[#E8E5F4] text-[#1E2022]"
              }`}
            >
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.language || "Multi-repo"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[var(--primary)]" />
            <span className="font-bold text-[var(--text-secondary)]">Entry Point:</span>
            <select
              value={selectedEntryPoint}
              onChange={(e) => setSelectedEntryPoint(e.target.value)}
              className={`py-1.5 px-3 rounded-xl border text-xs font-semibold font-mono outline-none cursor-pointer ${
                isDark
                  ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                  : "bg-white border-[#E8E5F4] text-[#1E2022]"
              }`}
            >
              <option value="auth_login">POST /api/auth/login · loginUser()</option>
              <option value="token_verify">POST /api/auth/token · verifySession()</option>
              <option value="metrics_agg">POST /analytics/aggregate · aggregate_metrics()</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)]">
          <span>{traceData.nodes.length} call stages</span>
          <span>·</span>
          <span>{traceData.confidenceLabel}</span>
        </div>
      </div>

      {/* AI Narration Panel (if requested) */}
      {aiNarration && (
        <div
          className={`p-6 rounded-3xl border space-y-3 ${
            isDark ? "bg-[#0D1117] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)]">
            <Sparkles className="w-4 h-4" />
            <span>AI Workflow Narration & Architectural Walkthrough</span>
          </div>
          <div className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
            {aiNarration}
          </div>
        </div>
      )}

      {/* View Mode: Pipeline vs Flowchart */}
      {viewMode === "pipeline" ? (
        <WorkflowTrace trace={traceData} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold text-[var(--text-secondary)]">
              Workflow Call Directed Acyclic Graph (DAG)
            </span>
          </div>
          <MermaidFlowchart chart={mermaidChart} isDark={isDark} />
        </div>
      )}
    </div>
  );
}
