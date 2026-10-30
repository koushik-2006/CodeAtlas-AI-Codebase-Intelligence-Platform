"use client";

import React, { useState, useEffect } from "react";
import {
  Bug,
  Play,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FolderGit2,
  FileCode,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DebugInvestigateRequest } from "@/types/debug";
import { apiClient } from "@/services/api-client";

interface RepositoryOption {
  id: string;
  name: string;
  owner: string;
  language: string;
  defaultBranch: string;
  lastAnalyzed?: string;
}

interface StackTraceInputProps {
  onInvestigate: (req: DebugInvestigateRequest) => void;
  isLoading: boolean;
  initialValues?: Partial<DebugInvestigateRequest>;
}

const TEMPLATES = [
  {
    name: "Auth Service TypeError (Repository Grounded)",
    error: "TypeError: Cannot read properties of undefined (reading 'token')",
    trace: `TypeError: Cannot read properties of undefined (reading 'token')
    at loginUser (src/services/auth.ts:41:33)
    at handleSubmit (src/components/LoginForm.tsx:28:32)`,
    repoId: "sample-project",
    expected: "loginUser should handle missing token in response and throw a descriptive error.",
    actual: "Uncaught TypeError crashed the login form rendering.",
    logs: "[ERROR] POST /api/v1/auth/session - Status 200 OK - Response body: {\"status\":\"success\"}",
  },
  {
    name: "Python KeyError (Standalone)",
    error: "KeyError: 'jwt_secret'",
    trace: `Traceback (most recent call last):
  File "/var/app/services/token.py", line 42, in generate_access_token
    secret = config["jwt_secret"]
KeyError: 'jwt_secret'`,
    repoId: "",
    expected: "Token generator reads jwt_secret from environment or configuration defaults.",
    actual: "Application crashes with unhandled KeyError on startup.",
    logs: "2026-01-15 10:24:12 [INFO] Initializing authentication microservice",
  },
  {
    name: "Go Nil Pointer Dereference (Standalone)",
    error: "panic: runtime error: invalid memory address or nil pointer dereference",
    trace: `panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: code=0x1 addr=0x0 pc=0x10a2b4]
main.ProcessSession(0x0)
    /go/src/app/services/session.go:28 +0x3a
main.main()
    /go/src/app/main.go:14 +0x24`,
    repoId: "",
    expected: "ProcessSession checks for nil session pointer before calling methods.",
    actual: "Process crashed with SIGSEGV signal.",
    logs: "http: panic serving 127.0.0.1:5432: runtime error: invalid memory address",
  },
];

export default function StackTraceInput({
  onInvestigate,
  isLoading,
  initialValues,
}: StackTraceInputProps) {
  const [errorMessage, setErrorMessage] = useState(initialValues?.errorMessage || "");
  const [stackTrace, setStackTrace] = useState(initialValues?.stackTrace || "");
  const [codeSnippet, setCodeSnippet] = useState(initialValues?.codeSnippet || "");
  const [selectedRepoId, setSelectedRepoId] = useState(initialValues?.repositoryId || "sample-project");
  const [revision, setRevision] = useState(initialValues?.revision || "");
  const [expectedBehavior, setExpectedBehavior] = useState(initialValues?.expectedBehavior || "");
  const [actualBehavior, setActualBehavior] = useState(initialValues?.actualBehavior || "");
  const [logs, setLogs] = useState(initialValues?.logs || "");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [repositories, setRepositories] = useState<RepositoryOption[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  useEffect(() => {
    async function loadRepos() {
      try {
        setLoadingRepos(true);
        const res = await apiClient.get<RepositoryOption[]>("/api/repositories");
        if (res.success && res.data) {
          setRepositories(res.data);
        }
      } catch (e) {
        console.error("Failed to load repositories:", e);
      } finally {
        setLoadingRepos(false);
      }
    }
    loadRepos();
  }, []);

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setErrorMessage(tmpl.error);
    setStackTrace(tmpl.trace);
    setSelectedRepoId(tmpl.repoId);
    setExpectedBehavior(tmpl.expected);
    setActualBehavior(tmpl.actual);
    setLogs(tmpl.logs);
    setCodeSnippet("");
    if (tmpl.expected || tmpl.logs) {
      setShowAdvanced(true);
    }
  };

  const handleReset = () => {
    setErrorMessage("");
    setStackTrace("");
    setCodeSnippet("");
    setSelectedRepoId("sample-project");
    setRevision("");
    setExpectedBehavior("");
    setActualBehavior("");
    setLogs("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!errorMessage.trim() && !stackTrace.trim() && !codeSnippet.trim() && !actualBehavior.trim()) {
      return;
    }

    onInvestigate({
      errorMessage: errorMessage.trim() || undefined,
      stackTrace: stackTrace.trim() || undefined,
      codeSnippet: codeSnippet.trim() || undefined,
      repositoryId: selectedRepoId || undefined,
      revision: revision.trim() || undefined,
      expectedBehavior: expectedBehavior.trim() || undefined,
      actualBehavior: actualBehavior.trim() || undefined,
      logs: logs.trim() || undefined,
    });
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-sm p-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#8B7CFF]/15 text-[#8B7CFF] flex items-center justify-center font-bold">
            <Bug className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Start Root-Cause Investigation
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Paste an error, stack trace, or unexpected behavior to trace verified source relationships.
            </p>
          </div>
        </div>

        {/* Quick Example Templates */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#8B7CFF]" /> Presets:
          </span>
          {TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-[var(--bg-primary)] hover:bg-[#8B7CFF]/10 text-[var(--text-secondary)] hover:text-[#8B7CFF] border border-[var(--border-color)] transition-colors font-medium"
            >
              {tmpl.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Repository Grounding vs Standalone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-[#8B7CFF]" />
              Repository Context
              <span className="text-[11px] font-normal text-[var(--text-secondary)]">
                (Select indexed repo or leave standalone)
              </span>
            </label>
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="w-full text-xs font-medium bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#8B7CFF]"
            >
              <option value="">Standalone Mode (No repository connection required)</option>
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.owner}/{r.name} ({r.language}) — {r.defaultBranch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
              Source Revision / Commit
              <span className="text-[11px] font-normal text-[var(--text-secondary)]">(Optional)</span>
            </label>
            <input
              type="text"
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="e.g. main@b7f8e12 or commit SHA"
              className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#8B7CFF]"
            />
          </div>
        </div>

        {/* Error Message Input */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
            Error Message or Exception Header
          </label>
          <input
            type="text"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="e.g. TypeError: Cannot read properties of undefined (reading 'token')"
            className="w-full text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#8B7CFF]"
          />
        </div>

        {/* Stack Trace Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1">
              Stack Trace
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] font-mono">
                Node / Python / Go / Java / Rust
              </span>
            </label>
            {stackTrace && (
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                {stackTrace.split("\n").length} lines
              </span>
            )}
          </div>
          <textarea
            rows={5}
            value={stackTrace}
            onChange={(e) => setStackTrace(e.target.value)}
            placeholder={`Paste stack trace here, for example:\nTypeError: Cannot read properties of undefined (reading 'token')\n    at loginUser (src/services/auth.ts:193:33)\n    at handleSubmit (src/components/LoginForm.tsx:116:32)`}
            className="w-full text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:ring-1 focus:ring-[#8B7CFF] resize-y"
          />
        </div>

        {/* Toggle Advanced Behavioral & Log Inputs */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-semibold text-[#8B7CFF] hover:underline flex items-center gap-1 py-1"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showAdvanced ? "Hide Expected/Actual Behavior & Logs" : "Add Expected vs Actual Behavior, Code Snippet & Logs"}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-3 pt-2 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/40 p-3.5 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Expected Behavior
                </label>
                <textarea
                  rows={2}
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="What was supposed to happen? (e.g. Reject with 401 and user-friendly error message)"
                  className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#8B7CFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Actual Behavior
                </label>
                <textarea
                  rows={2}
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  placeholder="What actually occurred? (e.g. Form broke with unhandled TypeError crash)"
                  className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#8B7CFF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Relevant Logs (stdout/stderr)
                </label>
                <textarea
                  rows={3}
                  value={logs}
                  onChange={(e) => setLogs(e.target.value)}
                  placeholder="Paste relevant application or container log lines..."
                  className="w-full text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#8B7CFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Failing Code Snippet (Optional)
                </label>
                <textarea
                  rows={3}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Optional isolated function or code block being debugged..."
                  className="w-full text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#8B7CFF]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={isLoading}
            className="text-xs text-[var(--text-secondary)]"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Clear
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || (!errorMessage.trim() && !stackTrace.trim() && !actualBehavior.trim())}
            className="px-5 py-2 font-semibold text-xs shadow-md shadow-[#8B7CFF]/20"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Investigating Evidence...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Root-Cause Investigation
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
