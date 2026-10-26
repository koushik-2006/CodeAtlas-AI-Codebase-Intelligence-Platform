"use client";

import React from "react";
import { X, ShieldCheck, Lock, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AgentToolDefinition } from "@/types/agent";

interface AgentPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: AgentToolDefinition[];
}

export function AgentPolicyModal({ isOpen, onClose, tools }: AgentPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#29D3C2]/20 border border-[#29D3C2]/30 flex items-center justify-center text-[#29D3C2]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Agent Safety Policy & Tool Registry
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Strict boundaries, explicit developer gates, and zero arbitrary shell execution.
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

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Policy Overview Callout */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#29D3C2]/10 via-[#8B7CFF]/10 to-transparent border border-[#29D3C2]/20 text-xs space-y-2">
            <div className="font-semibold text-[#29D3C2] flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Core Safety Invariants
            </div>
            <ul className="space-y-1.5 text-[var(--text-secondary)] pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#29D3C2] shrink-0 mt-0.5" />
                <span><strong>No Silent Overwrite:</strong> Mutating tools strictly require prior human authorization. Approval for one action never authorizes unrelated actions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#29D3C2] shrink-0 mt-0.5" />
                <span><strong>Untrusted Input Sanitization:</strong> Repository code, issue text, stack traces, and LLM text are strictly sanitized. They cannot grant additional permissions.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#29D3C2] shrink-0 mt-0.5" />
                <span><strong>Grounding Verification:</strong> Every citation is validated against actual AST definitions and line number bounds.</span>
              </li>
            </ul>
          </div>

          {/* Registered Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Registered Safe Tools ({tools.length})
            </h3>
            <div className="space-y-2.5">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]/60 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-[200px] flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[var(--text-primary)]">
                        {tool.name}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                        ({tool.id})
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {tool.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={tool.isMutating ? "coral" : "mint"} className="text-[10px]">
                      {tool.isMutating ? "Mutating (Gate Required)" : "Read-Only"}
                    </Badge>
                    <span className="px-2 py-0.5 rounded bg-[var(--border-color)]/40 font-mono text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tool.timeoutMs / 1000}s
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#8B7CFF]/15 border border-[#8B7CFF]/30 font-mono text-[10px] text-[#8B7CFF]">
                      {tool.requiredPermission}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border-color)] flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
