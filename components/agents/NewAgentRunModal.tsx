"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  Bug,
  ShieldAlert,
  Sparkles,
  FlaskConical,
  BookOpen,
  ArrowRight,
  Loader2,
  FolderGit2,
  Workflow,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AgentType, WorkflowTemplate, AgentDescriptor, StartAgentRunRequest } from "@/types/agent";

interface NewAgentRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: StartAgentRunRequest) => Promise<void>;
  agents: AgentDescriptor[];
  workflows: WorkflowTemplate[];
  initialRepo?: string;
}

export function NewAgentRunModal({
  isOpen,
  onClose,
  onSubmit,
  agents,
  workflows,
  initialRepo = "sample-project",
}: NewAgentRunModalProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>("debugging");
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("investigate_bug");
  const [selectedRepo, setSelectedRepo] = useState<string>(initialRepo);
  const [taskPrompt, setTaskPrompt] = useState<string>(
    "Investigate TypeError: Cannot read properties of undefined (reading 'token') reported in loginUser."
  );
  const [preferredDetail, setPreferredDetail] = useState<"concise" | "detailed">("detailed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectWorkflow = (wf: WorkflowTemplate) => {
    setSelectedWorkflow(wf.id);
    setSelectedAgent(wf.agentType);
    setTaskPrompt(wf.defaultPrompt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskPrompt.trim()) {
      setError("Please enter a task or question for the agent.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        agentType: selectedAgent,
        workflowType: selectedWorkflow,
        repositoryId: selectedRepo,
        taskPrompt: taskPrompt.trim(),
        options: {
          preferredDetail,
          autoApproveReadOnly: true,
        },
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to start agent run.");
    } finally {
      setLoading(false);
    }
  };

  const getAgentIcon = (type: AgentType) => {
    switch (type) {
      case "codebase_research":
        return <Search className="w-4 h-4 text-[#29D3C2]" />;
      case "debugging":
        return <Bug className="w-4 h-4 text-[#FF7A70]" />;
      case "code_review":
        return <ShieldAlert className="w-4 h-4 text-[#8B7CFF]" />;
      case "refactoring":
        return <Sparkles className="w-4 h-4 text-[#2FD6A0]" />;
      case "test_generation":
        return <FlaskConical className="w-4 h-4 text-[#F3C969]" />;
      case "documentation":
        return <BookOpen className="w-4 h-4 text-[#8B7CFF]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#8B7CFF]/20 border border-[#8B7CFF]/30 flex items-center justify-center text-[#8B7CFF]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Launch Developer Agent
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Configure a supervised engineering workflow with verified citations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* 1. Workflow Template Quick Pick */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-[#29D3C2]" />
              Select Engineering Workflow Template:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {workflows.map((wf) => {
                const isSelected = selectedWorkflow === wf.id;
                return (
                  <button
                    type="button"
                    key={wf.id}
                    onClick={() => handleSelectWorkflow(wf)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? "bg-[#8B7CFF]/10 border-[#8B7CFF] text-[var(--text-primary)]"
                        : "bg-[var(--card-bg)]/60 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[#8B7CFF]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {wf.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#8B7CFF]" />
                      )}
                    </div>
                    <p className="text-[11px] line-clamp-1 opacity-80">
                      {wf.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Repository Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-[#8B7CFF]" />
                Target Authorized Repository:
              </label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#29D3C2]"
              >
                <option value="sample-project">sample-project (Indexed Reference)</option>
                <option value="auth-service">auth-service (Microservice)</option>
                <option value="payment-gateway">payment-gateway (Microservice)</option>
                <option value="notification-service">notification-service (Microservice)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 block">
                Response Detail:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredDetail("detailed")}
                  className={`flex-1 py-2 text-xs rounded-xl border font-medium ${
                    preferredDetail === "detailed"
                      ? "bg-[#29D3C2]/15 border-[#29D3C2] text-[#29D3C2]"
                      : "bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-secondary)]"
                  }`}
                >
                  Detailed & Grounded
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredDetail("concise")}
                  className={`flex-1 py-2 text-xs rounded-xl border font-medium ${
                    preferredDetail === "concise"
                      ? "bg-[#29D3C2]/15 border-[#29D3C2] text-[#29D3C2]"
                      : "bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-secondary)]"
                  }`}
                >
                  Concise
                </button>
              </div>
            </div>
          </div>

          {/* 3. Task Prompt */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-primary)] mb-1.5 block">
              Task Prompt or Question:
            </label>
            <textarea
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="Describe the bug, investigation question, or desired refactoring..."
              rows={3}
              className="w-full p-3 rounded-xl bg-[#070A12] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none focus:border-[#8B7CFF] resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting Run...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Launch Agent Run
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
