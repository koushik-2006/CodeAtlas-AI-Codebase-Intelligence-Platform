"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bot, RefreshCw, AlertCircle, Plus } from "lucide-react";
import { AgentWorkspaceHeader } from "@/components/agents/AgentWorkspaceHeader";
import { AgentRunCard } from "@/components/agents/AgentRunCard";
import { AgentRunDetailView } from "@/components/agents/AgentRunDetailView";
import { NewAgentRunModal } from "@/components/agents/NewAgentRunModal";
import { AgentPolicyModal } from "@/components/agents/AgentPolicyModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import {
  AgentRun,
  AgentDescriptor,
  AgentToolDefinition,
  WorkflowTemplate,
  StartAgentRunRequest,
} from "@/types/agent";

export default function AgentWorkspacePage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentDescriptor[]>([]);
  const [tools, setTools] = useState<AgentToolDefinition[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);

  // Filters
  const [selectedRepo, setSelectedRepo] = useState<string>("all");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Modals
  const [isNewRunModalOpen, setIsNewRunModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch agent descriptors and tools
  const fetchMetadata = async () => {
    try {
      const [agentRes, wfRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/agents/workflows"),
      ]);
      const agentData = await agentRes.json();
      const wfData = await wfRes.json();

      if (agentData.success) {
        setAgents(agentData.agents || []);
        setTools(agentData.tools || []);
      }
      if (wfData.success) {
        setWorkflows(wfData.workflows || []);
      }
    } catch (err: any) {
      console.error("Failed to load agent metadata:", err);
    }
  };

  // Fetch runs
  const fetchRuns = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedRepo !== "all") params.set("repositoryId", selectedRepo);
      if (selectedAgent !== "all") params.set("agentType", selectedAgent);
      if (selectedStatus !== "all") params.set("status", selectedStatus);

      const res = await fetch(`/api/agents/runs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRuns(data.runs || []);
        if (data.runs?.length > 0 && !selectedRunId) {
          setSelectedRunId(data.runs[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch agent runs.");
    } finally {
      setLoading(false);
    }
  }, [selectedRepo, selectedAgent, selectedStatus, selectedRunId]);

  useEffect(() => {
    fetchMetadata();
    fetchRuns();
  }, [fetchRuns]);

  // Periodic polling for active runs
  useEffect(() => {
    const hasActiveRuns = runs.some((r) => r.status === "running" || r.status === "queued");
    if (!hasActiveRuns) return;

    const interval = setInterval(() => {
      fetchRuns();
    }, 3000);

    return () => clearInterval(interval);
  }, [runs, fetchRuns]);

  const selectedRun = runs.find((r) => r.id === selectedRunId) || (runs.length > 0 ? runs[0] : null);

  const handleCreateRun = async (req: StartAgentRunRequest) => {
    const res = await fetch("/api/agents/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to create agent run.");
    }
    await fetchRuns();
    if (data.run?.id) {
      setSelectedRunId(data.run.id);
    }
  };

  const handleApproveAction = async (actionId: string) => {
    if (!selectedRun) return;
    const res = await fetch(`/api/agents/runs/${selectedRun.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId, decision: "approve" }),
    });
    const data = await res.json();
    if (!data.success) {
      alert(`Approval error: ${data.error}`);
    }
    await fetchRuns();
  };

  const handleRejectAction = async (actionId: string, reason?: string) => {
    if (!selectedRun) return;
    const res = await fetch(`/api/agents/runs/${selectedRun.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId, decision: "reject", reason }),
    });
    const data = await res.json();
    if (!data.success) {
      alert(`Reject error: ${data.error}`);
    }
    await fetchRuns();
  };

  const handleControlCommand = async (command: "pause" | "resume" | "cancel" | "retry") => {
    if (!selectedRun) return;
    const res = await fetch(`/api/agents/runs/${selectedRun.id}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
    const data = await res.json();
    if (!data.success) {
      alert(`Control command failed: ${data.error}`);
    }
    await fetchRuns();
  };

  const handleDeleteRun = async () => {
    if (!selectedRun) return;
    if (!confirm("Are you sure you want to delete this agent run history?")) return;

    const res = await fetch(`/api/agents/runs/${selectedRun.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      setSelectedRunId(null);
      await fetchRuns();
    }
  };

  const runningCount = runs.filter((r) => r.status === "running").length;
  const awaitingApprovalCount = runs.filter((r) => r.status === "awaiting_approval").length;

  return (
    <div className="flex flex-col h-full max-w-[1600px] mx-auto p-4 md:p-6">
      <AgentWorkspaceHeader
        totalRuns={runs.length}
        runningCount={runningCount}
        awaitingApprovalCount={awaitingApprovalCount}
        selectedRepo={selectedRepo}
        onSelectRepo={setSelectedRepo}
        selectedAgent={selectedAgent}
        onSelectAgent={setSelectedAgent}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onNewRun={() => setIsNewRunModalOpen(true)}
        onOpenPolicy={() => setIsPolicyModalOpen(true)}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <LoadingState message="Loading agent workspace and execution history..." />
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-red-400">Failed to load agent workspace</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRuns}
            className="mt-4 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        </div>
      ) : runs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <EmptyState
            title="No Agent Runs Found"
            description="No agent runs match the current filter criteria. Launch a new developer agent to research, debug, review, or refactor code."
            action={
              <Button
                variant="primary"
                onClick={() => setIsNewRunModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Launch First Agent Run
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Run List Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-1 max-h-[calc(100vh-250px)]">
            {runs.map((run) => (
              <AgentRunCard
                key={run.id}
                run={run}
                isSelected={run.id === selectedRun?.id}
                onSelect={() => setSelectedRunId(run.id)}
              />
            ))}
          </div>

          {/* Detailed View Panel */}
          <div className="lg:col-span-8 flex flex-col min-h-0 h-full">
            {selectedRun ? (
              <AgentRunDetailView
                run={selectedRun}
                onApproveAction={handleApproveAction}
                onRejectAction={handleRejectAction}
                onControlCommand={handleControlCommand}
                onDeleteRun={handleDeleteRun}
              />
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-[var(--border-color)] rounded-2xl p-12 text-center text-xs text-[var(--text-secondary)]">
                Select an agent run on the left to inspect execution steps, citations, and approval gates.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <NewAgentRunModal
        isOpen={isNewRunModalOpen}
        onClose={() => setIsNewRunModalOpen(false)}
        onSubmit={handleCreateRun}
        agents={agents}
        workflows={workflows}
        initialRepo={selectedRepo !== "all" ? selectedRepo : "sample-project"}
      />

      <AgentPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        tools={tools}
      />
    </div>
  );
}
