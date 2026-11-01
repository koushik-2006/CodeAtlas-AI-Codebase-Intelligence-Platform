"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { CodeLensWorkspace } from "./CodeLensWorkspace";
import { VisualizeWorkspace } from "./VisualizeWorkspace";
import { CodeCityView } from "./CodeCityView";
import { WorkflowTraceWorkspace } from "./WorkflowTraceWorkspace";
import { HistoryDrawer } from "./HistoryDrawer";
import {
  Code2,
  GitBranch,
  Building2,
  Workflow,
  History,
  Sparkles,
} from "lucide-react";
import {
  CodeAnalysisHistoryItem,
  getExplorerHistory,
} from "@/lib/demo/store";

export type ExplorerTab = "codelens" | "visualize" | "city" | "workflow";

interface VisualExplorerViewProps {
  defaultTab?: ExplorerTab;
}

function VisualExplorerContent({ defaultTab = "codelens" }: VisualExplorerViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as ExplorerTab | null;
  const [activeTab, setActiveTab] = useState<ExplorerTab>(
    tabParam || defaultTab
  );

  // Sync tab with URL query parameter
  const handleTabChange = (t: ExplorerTab) => {
    setActiveTab(t);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (tabParam && ["codelens", "visualize", "city", "workflow"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // CodeLens buffer state for cross-tab loading (e.g. from Code City or History)
  const [bufferCode, setBufferCode] = useState<string | undefined>(undefined);
  const [bufferLanguage, setBufferLanguage] = useState<string | undefined>(undefined);

  // History Drawer state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState<number>(() => {
    return getExplorerHistory().length;
  });

  const handleSelectHistoryItem = (item: CodeAnalysisHistoryItem) => {
    setBufferCode(item.code);
    setBufferLanguage(item.language);
    handleTabChange("codelens");
  };

  const handleLoadCityFileToCodeLens = (fileCode: string, lang: string) => {
    setBufferCode(fileCode);
    setBufferLanguage(lang);
    handleTabChange("codelens");
  };

  const tabs: Array<{
    id: ExplorerTab;
    label: string;
    sublabel: string;
    icon: any;
  }> = [
    {
      id: "codelens",
      label: "CodeLens Snippet",
      sublabel: "9 Analysis Modes & Fixes",
      icon: Code2,
    },
    {
      id: "visualize",
      label: "Visualize",
      sublabel: "Flowchart, Sequence & Trace",
      icon: GitBranch,
    },
    {
      id: "city",
      label: "Code City",
      sublabel: "2.5D Isometric Repository",
      icon: Building2,
    },
    {
      id: "workflow",
      label: "Workflow Trace",
      sublabel: "End-to-End Call Chain",
      icon: Workflow,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header with History Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Visual Code Explorer"
          sub="Understand, photograph, visualize, and trace code across multi-tier repositories."
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] text-xs font-bold transition-all shadow-xs"
          >
            <History className="w-4 h-4 text-[var(--primary)]" />
            <span>Analysis History</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-bold">
              {historyCount}
            </span>
          </button>
        </div>
      </div>

      {/* 4 Main Tabs Navigation */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)]/60"
        role="tablist"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleTabChange(tab.id)}
              className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                isSelected
                  ? "bg-[var(--primary)] text-white shadow-md scale-101"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-color)]/50"
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-[var(--primary)]/10 text-[var(--primary)]"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold truncate">
                  {tab.label}
                </span>
                <span
                  className={`block text-[10px] truncate ${
                    isSelected ? "text-white/80" : "text-[var(--text-secondary)]"
                  }`}
                >
                  {tab.sublabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "codelens" && (
          <CodeLensWorkspace
            initialCode={bufferCode}
            initialLanguage={bufferLanguage}
            onOpenFlowchartTab={() => handleTabChange("visualize")}
          />
        )}

        {activeTab === "visualize" && (
          <VisualizeWorkspace
            initialCode={bufferCode}
            initialLanguage={bufferLanguage || "typescript"}
          />
        )}

        {activeTab === "city" && (
          <CodeCityView
            onLoadFileToCodeLens={handleLoadCityFileToCodeLens}
          />
        )}

        {activeTab === "workflow" && <WorkflowTraceWorkspace />}
      </div>

      {/* Collapsible Left History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryCount(getExplorerHistory().length);
        }}
        onSelectHistoryItem={handleSelectHistoryItem}
      />
    </div>
  );
}

export function VisualExplorerView({ defaultTab = "codelens" }: VisualExplorerViewProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
          Loading Visual Code Explorer...
        </div>
      }
    >
      <VisualExplorerContent defaultTab={defaultTab} />
    </Suspense>
  );
}
