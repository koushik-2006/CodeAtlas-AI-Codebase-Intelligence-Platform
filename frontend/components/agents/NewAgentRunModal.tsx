"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Bug,
  FlaskConical,
  BookOpen,
  ShieldAlert,
  ArrowUpCircle,
  Sparkles,
  Layers,
  FolderGit2,
  FileCode,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WorkflowTemplate, StartAgentRunRequest, AgentPolicy } from "@/types/agent";
import { validateRunPolicy } from "@/lib/demo/agent-engine";

interface NewAgentRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: StartAgentRunRequest) => Promise<void>;
  workflows: WorkflowTemplate[];
  repositories: Array<{ id: string; name: string }>;
  repositoryFiles: Record<string, Record<string, { code: string; language: string }>>;
  policy?: AgentPolicy;
  initialWorkflow?: WorkflowTemplate | null;
  initialRepo?: string;
}

export function NewAgentRunModal({
  isOpen,
  onClose,
  onSubmit,
  workflows,
  repositories,
  repositoryFiles,
  policy,
  initialWorkflow,
  initialRepo = "sample-project",
}: NewAgentRunModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("unit_tests");
  const [selectedRepo, setSelectedRepo] = useState<string>(initialRepo);
  const [targetType, setTargetType] = useState<"file" | "symbol" | "custom">("file");
  const [target, setTarget] = useState<string>("src/services/auth.ts");
  const [stackTrace, setStackTrace] = useState<string>(
    "TypeError: Cannot read properties of undefined (reading 'token')\n    at loginUser (src/services/auth.ts:28:19)\n    at handleSubmit (src/components/LoginForm.tsx:28:25)"
  );
  const [instructions, setInstructions] = useState<string>("");
  const [requireApproval, setRequireApproval] = useState<boolean>(true);
  const [maxFiles, setMaxFiles] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync initial selection
  useEffect(() => {
    if (initialWorkflow) {
      setSelectedTemplateId(initialWorkflow.id);
      setInstructions(initialWorkflow.defaultPrompt || "");
    } else {
      const defaultWf = workflows.find((w) => w.id === selectedTemplateId) || workflows[0];
      if (defaultWf && !instructions) {
        setInstructions(defaultWf.defaultPrompt || "");
      }
    }
  }, [initialWorkflow, workflows]);

  if (!isOpen) return null;

  // Available files for the currently selected repository
  const availableFiles = Object.keys(repositoryFiles[selectedRepo] || {});
  const currentWorkflow = workflows.find((w) => w.id === selectedTemplateId) || workflows[0];

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = workflows.find((w) => w.id === tmplId);
    if (tmpl) {
      setInstructions(tmpl.defaultPrompt || "");
    }
  };

  const handleRepoChange = (repoId: string) => {
    setSelectedRepo(repoId);
    const files = Object.keys(repositoryFiles[repoId] || {});
    if (files.length > 0) {
      setTarget(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!target.trim()) {
      setValidationError("Please select or specify a target file or symbol.");
      return;
    }

    if (!instructions.trim()) {
      setValidationError("Please provide task instructions for the agent.");
      return;
    }

    const targetRepoObj = repositories.find((r) => r.id === selectedRepo);
    const tmpl = workflows.find((w) => w.id === selectedTemplateId) || workflows[0];

    const req: StartAgentRunRequest = {
      agentType: tmpl?.agentType || "test_generation",
      repositoryId: selectedRepo,
      taskPrompt: instructions.trim(),
      templateId: selectedTemplateId,
      templateName: tmpl?.name,
      target: target.trim(),
      stackTrace: selectedTemplateId === "fix_bug" ? stackTrace.trim() : undefined,
      instructions: instructions.trim(),
      options: {
        requireApproval,
        maxFilesToChange: maxFiles,
      },
    };

    setIsSubmitting(true);
    try {
      await onSubmit(req);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || "Failed to start agent run.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check policy warning in real time
  const policyCheck = validateRunPolicy(policy, {
    agentType: currentWorkflow?.agentType || "test_generation",
    repositoryId: selectedRepo,
    taskPrompt: instructions,
    templateId: selectedTemplateId,
    target,
    options: {
      maxFilesToChange: maxFiles,
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#EAE6FD] dark:border-[#1E2638] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA]">
                Start New Agent Run
              </h3>
              <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-0.5">
                Launch a multi-step autonomous task with live reasoning, AST validation, and approval gate.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E95A8] hover:text-[#19143D] dark:hover:text-[#F3F5FA] hover:bg-neutral-100 dark:hover:bg-[#1A1F30]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {!policyCheck.allowed && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Workspace Policy Notice:</span>
                <span>{policyCheck.reason} (Execution will be stopped with 'Blocked by policy').</span>
              </div>
            </div>
          )}

          {/* 1. Choose Template */}
          <div>
            <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1.5">
              1. Choose Workflow Template *
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] font-medium outline-none focus:border-[#7C5CFC]"
            >
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Choose Repository */}
          <div>
            <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1.5">
              2. Target Repository *
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedRepo}
                onChange={(e) => handleRepoChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] font-medium outline-none focus:border-[#7C5CFC]"
              >
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name} ({repo.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Choose Target File / Symbol */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA]">
                3. Target (File, Symbol, or Scope) *
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setTargetType("file")}
                  className={`hover:underline cursor-pointer ${targetType === "file" ? "text-[#7C5CFC] font-bold" : "text-[#8E95A8]"}`}
                >
                  Indexed File
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setTargetType("custom")}
                  className={`hover:underline cursor-pointer ${targetType === "custom" ? "text-[#7C5CFC] font-bold" : "text-[#8E95A8]"}`}
                >
                  Custom Path/Symbol
                </button>
              </div>
            </div>

            {targetType === "file" && availableFiles.length > 0 ? (
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] font-mono outline-none focus:border-[#7C5CFC]"
              >
                {availableFiles.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. src/services/auth.ts or loginUser"
                className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] font-mono outline-none focus:border-[#7C5CFC]"
              />
            )}
          </div>

          {/* Special Field: Stack Trace for Bug Fixes */}
          {selectedTemplateId === "fix_bug" && (
            <div>
              <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1">
                Paste Exception Stack Trace / Error Log
              </label>
              <textarea
                rows={3}
                value={stackTrace}
                onChange={(e) => setStackTrace(e.target.value)}
                placeholder="Paste runtime stack trace with error message and file:line frames..."
                className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] font-mono text-[11px] outline-none focus:border-[#7C5CFC]"
              />
            </div>
          )}

          {/* 4. Instructions */}
          <div>
            <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1">
              4. Instructions & Prompt *
            </label>
            <textarea
              rows={3}
              required
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe what the agent should accomplish..."
              className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] outline-none focus:border-[#7C5CFC]"
            />
          </div>

          {/* 5. Options: Approval Gate & Max Files */}
          <div className="p-3.5 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE]/60 dark:bg-[#141926]/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block">
                  Require Human Approval Before Apply
                </span>
                <span className="text-[11px] text-[#6E6A8A] dark:text-[#8E95A8]">
                  Agent pauses at Step 6 with unified diff awaiting developer authorization.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="w-4 h-4 rounded text-[#7C5CFC] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#EAE6FD] dark:border-[#242B3D]">
              <span className="font-semibold text-[#19143D] dark:text-[#F3F5FA]">
                Max Files to Change
              </span>
              <input
                type="number"
                min={1}
                max={10}
                value={maxFiles}
                onChange={(e) => setMaxFiles(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-center rounded-lg border border-[#EAE6FD] dark:border-[#242B3D] bg-white dark:bg-[#0D111A] text-[#19143D] dark:text-[#F3F5FA] font-bold"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE6FD] dark:border-[#1E2638]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6A4BE8] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Initializing..." : "Start Agent Run"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
