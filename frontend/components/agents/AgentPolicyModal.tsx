"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Lock,
  AlertCircle,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AgentPolicy, WorkflowTemplate } from "@/types/agent";

interface AgentPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: AgentPolicy;
  workflows: WorkflowTemplate[];
  workspaceName?: string;
  onSavePolicy: (policy: Partial<AgentPolicy>) => void;
}

export function AgentPolicyModal({
  isOpen,
  onClose,
  policy,
  workflows,
  workspaceName = "Acme Engineering",
  onSavePolicy,
}: AgentPolicyModalProps) {
  const [requireApproval, setRequireApproval] = useState<boolean>(true);
  const [allowDependencyUpgrades, setAllowDependencyUpgrades] = useState<boolean>(true);
  const [maxFiles, setMaxFiles] = useState<number>(5);
  const [blockedPathsStr, setBlockedPathsStr] = useState<string>(".env, secrets/, .pem, id_rsa");
  const [allowedTemplates, setAllowedTemplates] = useState<string[]>([]);

  useEffect(() => {
    if (policy) {
      setRequireApproval(policy.requireApproval ?? true);
      setAllowDependencyUpgrades(policy.allowDependencyUpgrades ?? true);
      setMaxFiles(policy.maxFilesPerRun || 5);
      setBlockedPathsStr((policy.blockedPaths || [".env", "secrets/"]).join(", "));
      setAllowedTemplates(policy.allowedTemplates || workflows.map((w) => w.id));
    }
  }, [policy, workflows]);

  if (!isOpen) return null;

  const handleToggleTemplate = (tmplId: string) => {
    if (allowedTemplates.includes(tmplId)) {
      setAllowedTemplates(allowedTemplates.filter((id) => id !== tmplId));
    } else {
      setAllowedTemplates([...allowedTemplates, tmplId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const blockedList = blockedPathsStr
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    onSavePolicy({
      requireApproval,
      allowDependencyUpgrades,
      maxFilesPerRun: maxFiles,
      blockedPaths: blockedList,
      allowedTemplates,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8 animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-[#EAE6FD] dark:border-[#1E2638] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA]">
                  Workspace Agent Safety Policies
                </h3>
                <Badge variant="brand" className="text-[10px]">
                  {workspaceName}
                </Badge>
              </div>
              <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-0.5">
                Strict boundaries, restricted file paths, and mandatory human authorization gates.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Toggles */}
          <div className="p-4 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE]/60 dark:bg-[#141926]/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-[#19143D] dark:text-[#F3F5FA] block">
                  Require Human Approval Before Apply
                </span>
                <span className="text-[11px] text-[#6E6A8A] dark:text-[#8E95A8]">
                  Mandates explicit developer review at Step 6 before writing any diffs to the repository.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="w-4 h-4 rounded text-[#7C5CFC] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EAE6FD] dark:border-[#242B3D]">
              <div>
                <span className="font-bold text-[#19143D] dark:text-[#F3F5FA] block">
                  Allow Automated Dependency Upgrades
                </span>
                <span className="text-[11px] text-[#6E6A8A] dark:text-[#8E95A8]">
                  Enables runs that modify package manifests (package.json, requirements.txt, go.mod).
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowDependencyUpgrades}
                onChange={(e) => setAllowDependencyUpgrades(e.target.checked)}
                className="w-4 h-4 rounded text-[#7C5CFC] cursor-pointer"
              />
            </div>
          </div>

          {/* Limits: Max files and Blocked paths */}
          <div className="space-y-3">
            <div>
              <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1">
                Max Files Modified Per Run
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxFiles}
                onChange={(e) => setMaxFiles(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-1.5 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1">
                Blocked File Paths (Comma-separated)
              </label>
              <input
                type="text"
                value={blockedPathsStr}
                onChange={(e) => setBlockedPathsStr(e.target.value)}
                placeholder=".env, secrets/, .pem, id_rsa"
                className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] font-mono outline-none focus:border-[#7C5CFC]"
              />
              <span className="text-[10px] text-[#8E95A8] mt-1 block">
                Any run targeting matching paths will stop with 'Blocked by policy'.
              </span>
            </div>
          </div>

          {/* Allowed Templates */}
          <div>
            <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1.5">
              Allowed Workflow Templates ({allowedTemplates.length} of {workflows.length} enabled)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {workflows.map((wf) => {
                const isChecked = allowedTemplates.includes(wf.id);
                return (
                  <label
                    key={wf.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? "bg-[#7C5CFC]/10 border-[#7C5CFC] text-[#19143D] dark:text-[#F3F5FA]"
                        : "bg-[#F7F5FE] dark:bg-[#141926] border-[#EAE6FD] dark:border-[#242B3D] text-[#8E95A8]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleTemplate(wf.id)}
                      className="w-3.5 h-3.5 rounded text-[#7C5CFC]"
                    />
                    <span className="text-[11px] font-medium truncate">{wf.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE6FD] dark:border-[#1E2638]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6A4BE8] text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              Save Policy Rules
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
