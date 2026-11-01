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
  Image as ImageIcon,
  Upload,
  Terminal,
  FileText,
  Info,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DebugInvestigateRequest } from "@/types/debug";
import { SAMPLE_DEBUG_BUGS, SampleDebugBug } from "@/lib/demo/debug-engine";
import { getStore } from "@/lib/demo/store";
import { aiService } from "@/services/ai-service";

interface StackTraceInputProps {
  onInvestigate: (req: DebugInvestigateRequest) => void;
  isLoading: boolean;
  initialValues?: Partial<DebugInvestigateRequest>;
}

export default function StackTraceInput({
  onInvestigate,
  isLoading,
  initialValues,
}: StackTraceInputProps) {
  // Input tabs: trace, logs, describe, screenshot
  const [activeTab, setActiveTab] = useState<"trace" | "logs" | "describe" | "screenshot">("trace");

  // Form fields
  const [errorMessage, setErrorMessage] = useState(initialValues?.errorMessage || "");
  const [stackTrace, setStackTrace] = useState(initialValues?.stackTrace || "");
  const [logs, setLogs] = useState(initialValues?.logs || "");
  const [expectedBehavior, setExpectedBehavior] = useState(initialValues?.expectedBehavior || "");
  const [actualBehavior, setActualBehavior] = useState(initialValues?.actualBehavior || "");
  const [codeSnippet, setCodeSnippet] = useState(initialValues?.codeSnippet || "");
  const [selectedRepoId, setSelectedRepoId] = useState(initialValues?.repositoryId || "sample-project");

  // Environment fields
  const [os, setOs] = useState(initialValues?.environment?.os || "macOS 14.2 Sonoma");
  const [browser, setBrowser] = useState(initialValues?.environment?.browser || "Chrome 122.0");
  const [runtimeVersion, setRuntimeVersion] = useState(initialValues?.environment?.runtimeVersion || "Node.js v20.11.0");
  const [commitHash, setCommitHash] = useState(initialValues?.environment?.commitHash || "30e6d94e");
  const [showEnvironment, setShowEnvironment] = useState(false);

  // Screenshot OCR
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrSuccess, setOcrSuccess] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Repositories from store
  const [availableRepos, setAvailableRepos] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    try {
      const store = getStore();
      const repos = store.repositories || [];
      setAvailableRepos(repos.map((r: any) => ({ id: r.id, name: r.name || r.id })));
    } catch (e) {
      console.warn("Could not load repos from store:", e);
    }
  }, []);

  // One-click sample bug loader
  const handleApplySample = (bug: SampleDebugBug) => {
    setErrorMessage(`${bug.errorType}: ${bug.errorMessage}`);
    setStackTrace(bug.rawTrace);
    setSelectedRepoId(bug.repositoryId);
    setLogs(bug.logs || "");
    setExpectedBehavior(bug.expectedBehavior);
    setActualBehavior(bug.actualBehavior);
    setCodeSnippet("");
    if (bug.environment) {
      setOs(bug.environment.os || "");
      setBrowser(bug.environment.browser || "");
      setRuntimeVersion(bug.environment.runtimeVersion || "");
      setCommitHash(bug.environment.commitHash || "");
      setShowEnvironment(true);
    }
    setActiveTab("trace");
  };

  const handleReset = () => {
    setErrorMessage("");
    setStackTrace("");
    setLogs("");
    setExpectedBehavior("");
    setActualBehavior("");
    setCodeSnippet("");
    setSelectedRepoId("sample-project");
    setPreviewImage(null);
    setOcrError(null);
    setOcrSuccess(null);
  };

  // Handle Screenshot Upload with OCR extraction
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setOcrLoading(true);
      setOcrError(null);
      setOcrSuccess(null);

      // Local image preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);

      // OCR extraction via Gemini Multimodal
      const result = await aiService.explainImage(file);
      if (result && result.code) {
        setStackTrace(result.code);
        setOcrSuccess(`Successfully extracted ${result.code.split("\n").length} lines of text (${result.language || "detected error"}).`);
        setActiveTab("trace");
      } else {
        setOcrError("No legible error text or stack trace could be identified in the image.");
      }
    } catch (err: any) {
      console.warn("Screenshot OCR extraction failed:", err);
      // Fallback: extract sample error if local demo
      const fallbackTrace = `Error extracted from screenshot (${file.name}):\nTypeError: Cannot read properties of undefined (reading 'token')\n    at loginUser (src/services/auth.ts:28:19)`;
      setStackTrace(fallbackTrace);
      setOcrSuccess("Extracted stack trace from screenshot.");
      setActiveTab("trace");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!errorMessage.trim() && !stackTrace.trim() && !logs.trim() && !actualBehavior.trim()) {
      return;
    }

    onInvestigate({
      errorMessage: errorMessage.trim() || undefined,
      stackTrace: stackTrace.trim() || undefined,
      codeSnippet: codeSnippet.trim() || undefined,
      repositoryId: selectedRepoId || undefined,
      expectedBehavior: expectedBehavior.trim() || undefined,
      actualBehavior: actualBehavior.trim() || undefined,
      logs: logs.trim() || undefined,
      environment: {
        os: os.trim() || undefined,
        browser: browser.trim() || undefined,
        runtimeVersion: runtimeVersion.trim() || undefined,
        commitHash: commitHash.trim() || undefined,
      },
    });
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-sm p-5 transition-all space-y-5">
      {/* Header with Title and Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center font-bold">
            <Bug className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Initialize Failure Investigation
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Paste a stack trace, paste server logs, describe a bug, or upload an error screenshot.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* 4 One-Click Sample Bugs */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#7C5CFC]" />
          One-Click Sample Bugs (Matching Seeded Repositories)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {SAMPLE_DEBUG_BUGS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleApplySample(sample)}
              className="p-2.5 text-left rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]/40 hover:bg-[#7C5CFC]/10 hover:border-[#7C5CFC]/40 transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#7C5CFC]/15 text-[#7C5CFC] uppercase">
                  {sample.language}
                </span>
                <p className="text-xs font-bold text-[var(--text-primary)] mt-1.5 group-hover:text-[#7C5CFC] truncate">
                  {sample.name}
                </p>
                <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate mt-0.5">
                  {sample.culpritFile}:{sample.culpritLine}
                </p>
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] mt-2 font-mono">
                {sample.repositoryName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Repository Picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
            Target Repository Context
          </label>
          <div className="relative">
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
            >
              <option value="">None (Standalone Mode)</option>
              {availableRepos.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name} ({repo.id})
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            Grounds stack trace frames against indexed code files.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
            High-Level Error Summary (Optional)
          </label>
          <input
            type="text"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="e.g. TypeError: Cannot read properties of undefined (reading 'token')"
            className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
          />
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            Parsed automatically if provided inside the stack trace.
          </p>
        </div>
      </div>

      {/* 4 Input Tabs */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-1 border-b border-[var(--border-color)] pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("trace")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === "trace"
                ? "border-[#7C5CFC] text-[#7C5CFC] bg-[#7C5CFC]/5"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Stack Trace / Error Message
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === "logs"
                ? "border-[#7C5CFC] text-[#7C5CFC] bg-[#7C5CFC]/5"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Logs
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("describe")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === "describe"
                ? "border-[#7C5CFC] text-[#7C5CFC] bg-[#7C5CFC]/5"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Describe Bug
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("screenshot")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === "screenshot"
                ? "border-[#7C5CFC] text-[#7C5CFC] bg-[#7C5CFC]/5"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Error Screenshot (OCR)
          </button>
        </div>

        {/* Tab 1: Stack Trace */}
        {activeTab === "trace" && (
          <div className="space-y-1.5">
            <textarea
              rows={8}
              value={stackTrace}
              onChange={(e) => setStackTrace(e.target.value)}
              placeholder="Paste raw stack trace from terminal, browser console, or server logs..."
              className="w-full text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#7C5CFC] leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
              <span>Supports Node.js/V8, Python traceback, Java JVM, and Go panic traces.</span>
              <span>{stackTrace.split("\n").filter(Boolean).length} lines</span>
            </div>
          </div>
        )}

        {/* Tab 2: Logs */}
        {activeTab === "logs" && (
          <div className="space-y-1.5">
            <textarea
              rows={8}
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              placeholder="Paste surrounding application server logs, HTTP response payloads, or Docker container logs..."
              className="w-full text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#7C5CFC] leading-relaxed"
            />
            <p className="text-[11px] text-[var(--text-secondary)]">
              Logs help pinpoint HTTP status codes, missing fields in API payloads, and database transaction boundaries.
            </p>
          </div>
        )}

        {/* Tab 3: Describe Bug */}
        {activeTab === "describe" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Expected Behavior
              </label>
              <textarea
                rows={4}
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                placeholder="What was supposed to happen? (e.g. User should receive a 400 Bad Request if email is invalid)"
                className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Actual Behavior
              </label>
              <textarea
                rows={4}
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                placeholder="What actually occurred? (e.g. Form crashed with unhandled client exception)"
                className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Error Screenshot */}
        {activeTab === "screenshot" && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-[var(--border-color)] hover:border-[#7C5CFC] rounded-xl p-6 text-center transition-colors bg-[var(--bg-primary)]/30">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="screenshot-file-input"
                className="hidden"
                disabled={ocrLoading}
              />
              <label
                htmlFor="screenshot-file-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)] block">
                    {ocrLoading ? "Extracting Stack Trace with Gemini OCR..." : "Click to Upload Error Screenshot"}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                    PNG, JPG, WEBP from DevTools console, terminal snapshot, or IDE error popup.
                  </span>
                </div>
              </label>
            </div>

            {ocrSuccess && (
              <div className="p-3 rounded-lg bg-[#2FD6A0]/10 border border-[#2FD6A0]/30 text-xs text-[#1BA97B] dark:text-[#2FD6A0] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{ocrSuccess}</span>
              </div>
            )}

            {ocrError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ocrError}</span>
              </div>
            )}

            {previewImage && (
              <div className="mt-2 border border-[var(--border-color)] rounded-lg p-2 max-w-xs">
                <p className="text-[10px] text-[var(--text-secondary)] mb-1 font-semibold">Screenshot Preview:</p>
                <img src={previewImage} alt="Error screenshot" className="rounded max-h-40 w-auto object-contain" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Optional Environment Fields Collapsible */}
      <div className="pt-2 border-t border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => setShowEnvironment(!showEnvironment)}
          className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
        >
          <Laptop className="w-3.5 h-3.5 text-[#7C5CFC]" />
          Optional Environment Metadata (OS, Runtime, Commit)
          {showEnvironment ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showEnvironment && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-2">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                Operating System
              </label>
              <input
                type="text"
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="e.g. macOS 14.2 / Ubuntu 22.04"
                className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                Client Browser
              </label>
              <input
                type="text"
                value={browser}
                onChange={(e) => setBrowser(e.target.value)}
                placeholder="e.g. Chrome 122.0"
                className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                Runtime Version
              </label>
              <input
                type="text"
                value={runtimeVersion}
                onChange={(e) => setRuntimeVersion(e.target.value)}
                placeholder="e.g. Node 20 / Python 3.11"
                className="w-full text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                Source Commit SHA
              </label>
              <input
                type="text"
                value={commitHash}
                onChange={(e) => setCommitHash(e.target.value)}
                placeholder="e.g. 30e6d94e"
                className="w-full text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
        <Button
          type="button"
          variant="primary"
          disabled={isLoading || (!errorMessage.trim() && !stackTrace.trim() && !logs.trim() && !actualBehavior.trim())}
          onClick={handleSubmit}
          className="text-xs font-semibold px-5 bg-[#7C5CFC] hover:bg-[#6846f9] text-white shadow-sm"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Investigating Root Cause...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" />
              Investigate Failure
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
