"use client";

import React from "react";
import { Bot, Plus, ShieldCheck, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AgentType, AgentRunStatus } from "@/types/agent";

interface AgentWorkspaceHeaderProps {
  totalRuns: number;
  runningCount: number;
  awaitingApprovalCount: number;
  selectedRepo: string;
  onSelectRepo: (repo: string) => void;
  selectedAgent: string;
  onSelectAgent: (agent: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  onNewRun: () => void;
  onOpenPolicy: () => void;
}

export function AgentWorkspaceHeader({
  totalRuns,
  runningCount,
  awaitingApprovalCount,
  selectedRepo,
  onSelectRepo,
  selectedAgent,
  onSelectAgent,
  selectedStatus,
  onSelectStatus,
  onNewRun,
  onOpenPolicy,
}: AgentWorkspaceHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-[var(--border-color)] pb-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B7CFF]/20 via-[#29D3C2]/20 to-transparent border border-[#8B7CFF]/30 flex items-center justify-center text-[#8B7CFF] shadow-[0_0_20px_-5px_rgba(139,124,255,0.4)]">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                AI Developer Agents
              </h1>
              <Badge variant="brand" className="tracking-wide">
                Phase 19
              </Badge>
              {awaitingApprovalCount > 0 && (
                <Badge variant="coral" className="animate-pulse">
                  {awaitingApprovalCount} Approval Required
                </Badge>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Autonomous, evidence-grounded engineering workflows with strict human approval gates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPolicy}
            className="flex items-center gap-2 text-xs"
          >
            <ShieldCheck className="w-4 h-4 text-[#29D3C2]" />
            Tool Registry & Policy
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onNewRun}
            className="flex items-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Agent Run
          </Button>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={selectedRepo}
            onChange={(e) => onSelectRepo(e.target.value)}
            className="bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#29D3C2]"
          >
            <option value="all">All Repositories</option>
            <option value="sample-project">sample-project</option>
            <option value="auth-service">auth-service</option>
            <option value="payment-gateway">payment-gateway</option>
            <option value="notification-service">notification-service</option>
          </select>

          <select
            value={selectedAgent}
            onChange={(e) => onSelectAgent(e.target.value)}
            className="bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#29D3C2]"
          >
            <option value="all">All Agent Types</option>
            <option value="codebase_research">Codebase Research</option>
            <option value="debugging">Debugging</option>
            <option value="code_review">Code Review</option>
            <option value="refactoring">Refactoring</option>
            <option value="test_generation">Test Generation</option>
            <option value="documentation">Documentation</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => onSelectStatus(e.target.value)}
            className="bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#29D3C2]"
          >
            <option value="all">All Statuses</option>
            <option value="running">Running</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-secondary)]">
          <span>Total Runs: <strong className="text-[var(--text-primary)]">{totalRuns}</strong></span>
          {runningCount > 0 && (
            <span className="text-[#29D3C2] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#29D3C2] animate-ping" />
              Active: {runningCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
