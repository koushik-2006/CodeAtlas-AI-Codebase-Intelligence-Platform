"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Play,
  Plus,
  Bug,
  FlaskConical,
  BookOpen,
  ShieldAlert,
  ArrowUpCircle,
  Layers,
  CheckCircle2,
  X,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WorkflowTemplate } from "@/types/agent";
import { STEP_DEFINITIONS } from "@/lib/demo/agent-engine";

interface WorkflowsSectionProps {
  workflows: WorkflowTemplate[];
  onRunWorkflow: (workflow: WorkflowTemplate) => void;
  onCreateCustomWorkflow: (workflow: WorkflowTemplate) => void;
}

export function WorkflowsSection({
  workflows,
  onRunWorkflow,
  onCreateCustomWorkflow,
}: WorkflowsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultPrompt, setDefaultPrompt] = useState("");
  const [selectedSteps, setSelectedSteps] = useState<string[]>(
    STEP_DEFINITIONS.map((s) => s.title)
  );

  const getWorkflowIcon = (id: string, iconName?: string) => {
    switch (id) {
      case "fix_bug":
        return <Bug className="w-5 h-5 text-[#FF7A70]" />;
      case "unit_tests":
        return <FlaskConical className="w-5 h-5 text-[#7C5CFC]" />;
      case "documentation":
        return <BookOpen className="w-5 h-5 text-[#3B82F6]" />;
      case "security_audit":
        return <ShieldAlert className="w-5 h-5 text-amber-500" />;
      case "upgrade_dependency":
        return <ArrowUpCircle className="w-5 h-5 text-emerald-500" />;
      case "refactor_function":
        return <Sparkles className="w-5 h-5 text-[#2FD6A0]" />;
      case "explain_module":
        return <Layers className="w-5 h-5 text-indigo-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#7C5CFC]" />;
    }
  };

  const handleToggleStep = (stepTitle: string) => {
    if (selectedSteps.includes(stepTitle)) {
      if (selectedSteps.length > 2) {
        setSelectedSteps(selectedSteps.filter((s) => s !== stepTitle));
      }
    } else {
      setSelectedSteps([...selectedSteps, stepTitle]);
    }
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !defaultPrompt.trim()) return;

    const newWf: WorkflowTemplate = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      agentType: "codebase_research",
      description: description.trim() || "Custom multi-step developer agent workflow.",
      defaultPrompt: defaultPrompt.trim(),
      stepCount: selectedSteps.length,
      steps: selectedSteps,
      typicalSteps: selectedSteps,
      isCustom: true,
      icon: "Sparkles",
    };

    onCreateCustomWorkflow(newWf);
    setIsModalOpen(false);
    setName("");
    setDescription("");
    setDefaultPrompt("");
    setSelectedSteps(STEP_DEFINITIONS.map((s) => s.title));
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-bold text-[#19143D] dark:text-[#F3F5FA] flex items-center gap-2">
            <span>Workflow Templates</span>
            <Badge variant="brand" className="text-[10px]">
              {workflows.length} Ready
            </Badge>
          </h2>
          <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8]">
            Pre-configured pipelines for common engineering tasks or design custom multi-step routines.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#7C5CFC]/30 text-[#7C5CFC] hover:bg-[#7C5CFC]/10 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create custom workflow</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {workflows.map((wf) => {
          const stepList = wf.typicalSteps || ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"];
          return (
            <div
              key={wf.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] flex flex-col justify-between hover:border-[#7C5CFC]/50 hover:shadow-sm transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="p-2.5 rounded-xl bg-[#F7F5FE] dark:bg-[#1A1F30] border border-[#EAE6FD] dark:border-[#242B3D]">
                    {getWorkflowIcon(wf.id, wf.icon)}
                  </div>
                  {wf.isCustom && (
                    <Badge variant="cyan" className="text-[10px]">
                      Custom
                    </Badge>
                  )}
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-[#19143D] dark:text-[#F3F5FA] mb-1 group-hover:text-[#7C5CFC] transition-colors">
                  {wf.name}
                </h3>
                <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] line-clamp-2 mb-3">
                  {wf.description}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8E95A8] mb-3">
                  <span>{stepList.length} steps</span>
                  <span>•</span>
                  <span>Approval required</span>
                </div>

                <button
                  onClick={() => onRunWorkflow(wf)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] hover:bg-[#7C5CFC] hover:text-white text-[#7C5CFC] dark:text-[#A78BFA] text-xs font-semibold border border-[#EAE6FD] dark:border-[#242B3D] transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Workflow</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Custom Workflow Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in my-8">
            <div className="p-5 border-b border-[#EAE6FD] dark:border-[#1E2638] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA]">
                  Create Custom Workflow
                </h3>
                <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-0.5">
                  Design a reusable multi-step task for your workspace repositories.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#8E95A8] hover:text-[#19143D] dark:hover:text-[#F3F5FA] hover:bg-neutral-100 dark:hover:bg-[#1A1F30]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Verify API Contract Consistency"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] outline-none focus:border-[#7C5CFC]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Audits OpenAPI endpoint definitions and verifies consumer caller contracts."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] outline-none focus:border-[#7C5CFC]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1.5">
                  Pipeline Steps ({selectedSteps.length} selected)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STEP_DEFINITIONS.map((step) => {
                    const isSelected = selectedSteps.includes(step.title);
                    return (
                      <div
                        key={step.id}
                        onClick={() => handleToggleStep(step.title)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-[#7C5CFC]/10 border-[#7C5CFC] text-[#7C5CFC]"
                            : "bg-[#F7F5FE] dark:bg-[#141926] border-[#EAE6FD] dark:border-[#242B3D] text-[#6E6A8A] dark:text-[#8E95A8]"
                        }`}
                      >
                        <span className="font-medium text-[11px]">{step.title}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#7C5CFC]" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#19143D] dark:text-[#F3F5FA] block mb-1">
                  Default Task Prompt *
                </label>
                <textarea
                  rows={3}
                  required
                  value={defaultPrompt}
                  onChange={(e) => setDefaultPrompt(e.target.value)}
                  placeholder="e.g. Inspect all service endpoints in src/api.ts and verify callers in downstream microservices."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-[#19143D] dark:text-[#F3F5FA] outline-none focus:border-[#7C5CFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE6FD] dark:border-[#1E2638]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6A4BE8] text-white text-xs font-semibold shadow-sm"
                >
                  Save Custom Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
