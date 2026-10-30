"use client";

import React, { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import City, { GRAPH_NODES } from "@/components/City";
import { CheckCircle2, GitCommit, FileCode2, Layers, Sparkles, Terminal } from "lucide-react";

interface NodeDetails {
  id: string;
  label: string;
  file: string;
  lines: string;
  callers: string[];
  callees: string[];
  verified: boolean;
}

const NODE_DETAILS_MAP: Record<string, NodeDetails> = {
  auth: {
    id: "auth",
    label: "authorize()",
    file: "services/auth-service.ts",
    lines: "L42-L88",
    callers: ["POST /api/auth", "oauthHandler()"],
    callees: ["UserService.findByEmail()", "verifyPasswordHash()"],
    verified: true,
  },
  api: {
    id: "api",
    label: "POST /auth",
    file: "app/api/auth/route.ts",
    lines: "L15-L64",
    callers: ["LoginForm.tsx (client)"],
    callees: ["authorize()", "rateLimiter.check()"],
    verified: true,
  },
  login: {
    id: "login",
    label: "LoginForm.tsx",
    file: "components/auth/LoginForm.tsx",
    lines: "L1-L120",
    callers: ["app/login/page.tsx"],
    callees: ["POST /api/auth", "useAuth()"],
    verified: true,
  },
  service: {
    id: "service",
    label: "UserService",
    file: "services/user-service.ts",
    lines: "L24-L105",
    callers: ["authorize()", "getProfile()"],
    callees: ["db.query('users')", "cache.get()"],
    verified: true,
  },
  db: {
    id: "db",
    label: "users table",
    file: "db/schema/users.sql",
    lines: "L1-L32",
    callers: ["UserService", "migration_004.sql"],
    callees: ["indexes: idx_users_email"],
    verified: true,
  },
  tests: {
    id: "tests",
    label: "test_auth.py",
    file: "tests/test_auth_flow.py",
    lines: "L18-L95",
    callers: ["CI test runner"],
    callees: ["authorize()", "mockDbClient"],
    verified: true,
  },
};

export function HeroVisualization() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedNodeId, setSelectedNodeId] = useState<string>("auth");
  const [viewMode, setViewMode] = useState<"graph" | "city">("graph");

  const currentNode = NODE_DETAILS_MAP[selectedNodeId] || NODE_DETAILS_MAP.auth;

  return (
    <div className="w-full space-y-3.5">
      {/* Interactive Main Window Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-lg transition-all duration-300">
        {/* Terminal / Window Title Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/70 px-4 py-2.5 backdrop-blur-md">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50" />
            <span className="h-3 w-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50" />
            <span className="ml-2 hidden font-mono text-[11px] font-semibold text-[var(--text-secondary)] sm:inline-flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[var(--primary)]" />
              codeatlas-core • ast-architecture-trace
            </span>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("graph")}
              className={`rounded-md px-2.5 py-1 transition-all ${
                viewMode === "graph"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Graph View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("city")}
              className={`rounded-md px-2.5 py-1 transition-all ${
                viewMode === "city"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              3D City View
            </button>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="relative p-2 sm:p-4 bg-[var(--bg-surface)]">
          {viewMode === "graph" ? (
            <div className="relative">
              <City
                selected={selectedNodeId}
                onPick={(id) => setSelectedNodeId(id)}
                forceMode="graph"
                className="w-full h-auto max-h-[300px] select-none"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-md bg-[var(--bg-page)]/80 backdrop-blur-md px-2 py-1 text-[10px] font-mono text-[var(--text-secondary)] border border-[var(--border-color)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Click any node to trace connection</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <City
                selected={selectedNodeId}
                onPick={(id) => setSelectedNodeId(id)}
                forceMode={isDark ? "dark" : "light"}
                className="w-full h-auto max-h-[300px] select-none"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-md bg-[var(--bg-page)]/80 backdrop-blur-md px-2 py-1 text-[10px] font-mono text-[var(--text-secondary)] border border-[var(--border-color)]">
                <Layers className="w-3 h-3 text-[var(--primary)]" />
                <span>Isometric codebase city height = complexity</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grounded Receipt & Active AST Citation Inspector Card */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3.5 sm:p-4 shadow-sm space-y-2.5 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Verified AST Citation
            </span>
            <span className="text-[var(--text-secondary)] hidden sm:inline">•</span>
            <span className="text-[var(--text-secondary)] hidden sm:inline">Confidence: 100% Deterministic</span>
          </div>
          <span className="rounded bg-[var(--primary)]/10 px-2 py-0.5 font-bold text-[var(--primary)] border border-[var(--primary)]/20">
            {currentNode.label}
          </span>
        </div>

        {/* Path and Call Chain Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--text-secondary)]">
              <FileCode2 className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Source File &amp; Range</span>
            </div>
            <div className="font-semibold text-[var(--text-primary)] truncate text-[11px]">
              {currentNode.file}
            </div>
            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
              Line Range: {currentNode.lines}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--text-secondary)]">
              <GitCommit className="w-3.5 h-3.5 text-purple-500" />
              <span>Direct Caller Chain</span>
            </div>
            <div className="font-semibold text-[var(--text-primary)] truncate text-[11px]">
              {currentNode.callers.join(" → ")}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span>Callees: {currentNode.callees[0]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
