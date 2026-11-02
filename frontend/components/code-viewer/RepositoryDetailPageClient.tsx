"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { RepositoryFileTree, FileItem } from "@/components/code-viewer/RepositoryFileTree";
import { SourceCodeViewer } from "@/components/code-viewer/SourceCodeViewer";
import { AssistantWorkspace } from "@/components/code-viewer/AssistantWorkspace";
import { sourceFileService } from "@/services/source-file-service";
import { codeIntelligenceService } from "@/services/code-intelligence-service";
import { SAMPLE_PROJECT_TREE } from "@/lib/sample-repository-files";
import { KnowledgeReportView } from "@/components/intelligence/KnowledgeReportView";
import { OnboardingGuidedJourney } from "@/components/intelligence/OnboardingGuidedJourney";
import { WorkflowTraceViewer } from "@/components/intelligence/WorkflowTraceViewer";
import { LearningPathView } from "@/components/intelligence/LearningPathView";
import { HealthInsightsView } from "@/components/intelligence/HealthInsightsView";
import { RepositoryOverviewData, OnboardingJourneyData } from "@/types/onboarding";
import { WorkflowTraceData, AvailableWorkflowEntryPoint } from "@/types/workflow-trace";
import { RepositoryLearningPath } from "@/types/learning-path";
import { RepositoryHealthScore } from "@/types/health-insights";
import { apiClient } from "@/services/api-client";
import { repositoryService } from "@/services/repository-service";
import {
  GitBranch,
  ArrowLeft,
  FolderGit2,
  Code2,
  BookOpen,
  Compass,
  GitFork,
  Activity,
  GraduationCap,
  CheckCircle2,
  RefreshCw,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type MainViewTab = "code" | "report" | "onboarding" | "learning" | "workflow" | "health";

function findPreferredFile(items: FileItem[]): string | null {
  const allFiles: FileItem[] = [];

  function collect(list: FileItem[]) {
    for (const item of list) {
      if (item.type === "file") {
        allFiles.push(item);
      }
      if (item.children && item.children.length > 0) {
        collect(item.children);
      }
    }
  }
  collect(items);

  if (allFiles.length === 0) return null;

  // 1. Check for non-empty README files
  const readmes = allFiles.filter(
    (f) =>
      f.name.toLowerCase().startsWith("readme") &&
      f.size !== "0 B" &&
      f.size !== "0"
  );
  if (readmes.length > 0) {
    readmes.sort((a, b) => a.path.split("/").length - b.path.split("/").length);
    return readmes[0].path;
  }

  // 2. Check for canonical entry point files
  const entryPointNames = [
    "app.py",
    "main.py",
    "server.py",
    "index.ts",
    "index.tsx",
    "index.js",
    "index.jsx",
    "app.tsx",
    "app.jsx",
    "main.ts",
    "main.js",
    "server.ts",
    "server.js",
    "main.go",
    "main.rs",
    "application.java",
    "main.java",
    "requirements.txt",
    "package.json",
  ];

  for (const ep of entryPointNames) {
    const match = allFiles.find(
      (f) => f.name.toLowerCase() === ep && f.size !== "0 B" && f.size !== "0"
    );
    if (match) return match.path;
  }

  // 3. Check for any indexable source code files (skipping dummy/hidden/placeholder files)
  const isDummyOrHidden = (f: FileItem) =>
    f.name.startsWith(".") ||
    f.name.toLowerCase() === ".gitkeep" ||
    f.name.toLowerCase() === ".gitignore" ||
    f.size === "0 B" ||
    f.size === "0";

  const sourceFiles = allFiles.filter(
    (f) =>
      !isDummyOrHidden(f) &&
      /\.(py|ts|tsx|js|jsx|java|go|rs|sql|html|css|json|yaml|yml|md|txt)$/i.test(f.name)
  );
  if (sourceFiles.length > 0) {
    sourceFiles.sort((a, b) => {
      const aDepth = a.path.split("/").length;
      const bDepth = b.path.split("/").length;
      if (aDepth !== bDepth) return aDepth - bDepth;
      return a.name.localeCompare(b.name);
    });
    return sourceFiles[0].path;
  }

  // 4. Any non-empty file
  const nonZero = allFiles.find((f) => !isDummyOrHidden(f));
  if (nonZero) return nonZero.path;

  // 5. Ultimate fallback
  return allFiles[0].path;
}

function RepositoryExplorerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const repoId = typeof params?.id === "string" ? params.id : "sample-project";

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Active top-level feature view tab
  const tabFromUrl = searchParams?.get("tab") as MainViewTab | null;
  const [mainTab, setMainTab] = useState<MainViewTab>(tabFromUrl || "code");

  // Selected file and line highlight states for Code View
  const initialFile = searchParams?.get("file") || (repoId === "sample-project" ? "src/components/LoginForm.tsx" : "");
  const initialLine = searchParams?.get("line") ? parseInt(searchParams.get("line")!, 10) : undefined;

  const [treeFiles, setTreeFiles] = useState<FileItem[]>(repoId === "sample-project" ? SAMPLE_PROJECT_TREE : []);
  const [selectedFilePath, setSelectedFilePath] = useState<string>(initialFile);
  const [fileContent, setFileContent] = useState<{ code: string; language: string; lineCount: number }>({
    code: "// Loading file content...",
    language: "typescript",
    lineCount: 1,
  });
  const [highlightRange, setHighlightRange] = useState<[number, number] | undefined>(
    initialLine ? [initialLine, initialLine] : undefined
  );
  const [activePanelTab, setActivePanelTab] = useState<"files" | "code" | "assistant">("code");

  // Repository metadata and indexing status
  const [repoMetadata, setRepoMetadata] = useState<{
    name: string;
    owner: string;
    defaultBranch: string;
    status: string;
    progress: number;
    currentStage?: string;
    fileCount: number;
    symbolCount: number;
    lastAnalyzed: string;
    isIndexed: boolean;
    commitSha?: string;
  } | null>(null);
  const [isReindexing, setIsReindexing] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(true);

  // Intelligence State
  const [onboardingOverview, setOnboardingOverview] = useState<RepositoryOverviewData | null>(null);
  const [onboardingJourney, setOnboardingJourney] = useState<OnboardingJourneyData | null>(null);
  const [workflowData, setWorkflowData] = useState<{
    trace: WorkflowTraceData;
    availableEntryPoints: AvailableWorkflowEntryPoint[];
  } | null>(null);
  const [selectedEntryPoint, setSelectedEntryPoint] = useState<string>("handleSubmit");
  const [learningPath, setLearningPath] = useState<RepositoryLearningPath | null>(null);
  const [healthScore, setHealthScore] = useState<RepositoryHealthScore | null>(null);
  const [isRefreshingReport, setIsRefreshingReport] = useState(false);

  // Load repository metadata
  useEffect(() => {
    let isCancelled = false;
    apiClient.get<any>(`/repositories/${repoId}`).then((res) => {
      if (!isCancelled && res.success && res.data) {
        setRepoMetadata(res.data);
      } else if (!isCancelled) {
        repositoryService.getRepositoryById(repoId).then((local) => {
          if (!isCancelled && local) {
            setRepoMetadata({
              name: local.name,
              owner: local.owner,
              defaultBranch: local.branch || "main",
              status: local.status,
              progress: local.progress,
              fileCount: (local as any).fileCount || 0,
              symbolCount: local.symbolCount || 0,
              lastAnalyzed: local.lastAnalyzed,
              isIndexed: local.status === "ready",
            });
          }
        });
      }
    }).catch(() => {
      if (!isCancelled) {
        repositoryService.getRepositoryById(repoId).then((local) => {
          if (!isCancelled && local) {
            setRepoMetadata({
              name: local.name,
              owner: local.owner,
              defaultBranch: local.branch || "main",
              status: local.status,
              progress: local.progress,
              fileCount: (local as any).fileCount || 0,
              symbolCount: local.symbolCount || 0,
              lastAnalyzed: local.lastAnalyzed,
              isIndexed: local.status === "ready",
            });
          }
        });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [repoId]);

  // Load tree files
  useEffect(() => {
    let isCancelled = false;

    const loadTree = async () => {
      let files = await sourceFileService.getRepositoryFileTree(repoId);
      if (isCancelled) return;

      if (!files || files.length === 0) {
        try {
          const res = await apiClient.get<any>(`/repositories/${repoId}/files`);
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            files = await sourceFileService.getRepositoryFileTree(repoId);
          }
        } catch (e) {
          console.warn("Failed tree recovery attempt:", e);
        }
      }

      if (isCancelled || !files || files.length === 0) return;

      setTreeFiles(files);

      // Check if current selectedFilePath exists in tree
      const flatPaths = new Set<string>();
      function gatherPaths(list: FileItem[]) {
        for (const item of list) {
          if (item.type === "file") flatPaths.add(item.path);
          if (item.children) gatherPaths(item.children);
        }
      }
      gatherPaths(files);

      if (
        !selectedFilePath ||
        !flatPaths.has(selectedFilePath) ||
        (repoId !== "sample-project" && selectedFilePath === "src/components/LoginForm.tsx") ||
        selectedFilePath.endsWith(".gitkeep") ||
        selectedFilePath.endsWith(".gitignore")
      ) {
        const pref = findPreferredFile(files);
        if (pref) {
          setSelectedFilePath(pref);
        }
      }
    };

    loadTree();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoId]);

  const handleTriggerReindex = async () => {
    setIsReindexing(true);
    try {
      await repositoryService.reanalyzeRepository(repoId);
      const files = await sourceFileService.getRepositoryFileTree(repoId);
      if (files && files.length > 0) setTreeFiles(files);
      const local = await repositoryService.getRepositoryById(repoId);
      if (local) {
        setRepoMetadata({
          name: local.name,
          owner: local.owner,
          defaultBranch: local.branch || "main",
          status: local.status,
          progress: local.progress,
          fileCount: (local as any).fileCount || 0,
          symbolCount: local.symbolCount || 0,
          lastAnalyzed: local.lastAnalyzed,
          isIndexed: local.status === "ready",
        });
      }
    } catch (e) {
      console.warn("Reindexing request error:", e);
    } finally {
      setIsReindexing(false);
    }
  };

  // Load file content when path changes
  useEffect(() => {
    sourceFileService.getFileContent(repoId, selectedFilePath).then((res) => {
      if (res) {
        setFileContent(res);
      }
    });
  }, [repoId, selectedFilePath]);

  // Fetch Phase 12 intelligence data
  useEffect(() => {
    codeIntelligenceService.getOnboardingData(repoId).then((data) => {
      if (data) {
        setOnboardingOverview(data.overview);
        setOnboardingJourney(data.journey);
      }
    });

    codeIntelligenceService.getWorkflowTrace(repoId, selectedEntryPoint).then((data) => {
      if (data) {
        setWorkflowData(data);
      }
    });

    codeIntelligenceService.getLearningPath(repoId).then((data) => {
      if (data) {
        setLearningPath(data);
      }
    });

    codeIntelligenceService.getHealthInsights(repoId).then((data) => {
      if (data) {
        setHealthScore(data);
      }
    });
  }, [repoId, selectedEntryPoint]);

  // Keep state updated if search params change
  useEffect(() => {
    const fileFromUrl = searchParams?.get("file");
    const lineFromUrl = searchParams?.get("line");
    const tabParam = searchParams?.get("tab") as MainViewTab | null;

    if (tabParam) {
      setMainTab(tabParam);
    }

    if (fileFromUrl) {
      setSelectedFilePath(fileFromUrl);
      if (lineFromUrl) {
        const l = parseInt(lineFromUrl, 10);
        if (!isNaN(l)) {
          setHighlightRange([l, l]);
        }
      }
      setMainTab("code");
    }
  }, [searchParams]);

  const handleSelectFile = (file: FileItem) => {
    setSelectedFilePath(file.path);
    setHighlightRange(undefined);
    setActivePanelTab("code");
  };

  const handleNavigateTarget = (targetFile: string, targetLine?: number) => {
    setSelectedFilePath(targetFile);
    if (targetLine) {
      setHighlightRange([targetLine, targetLine]);
    } else {
      setHighlightRange(undefined);
    }
    setMainTab("code");
    setActivePanelTab("code");
  };

  const handleCitationClick = (citation: { file: string; startLine?: number; endLine?: number }) => {
    if (citation.file) {
      setSelectedFilePath(citation.file);
      if (citation.startLine && citation.endLine) {
        setHighlightRange([citation.startLine, citation.endLine]);
      } else {
        setHighlightRange(undefined);
      }
      setMainTab("code");
      setActivePanelTab("code");
    }
  };

  const handleRefreshReport = async () => {
    setIsRefreshingReport(true);
    const data = await codeIntelligenceService.getOnboardingData(repoId);
    setIsRefreshingReport(false);
    if (data) {
      setOnboardingOverview(data.overview);
      setOnboardingJourney(data.journey);
    }
  };

  const handleCompleteOnboardingStep = async (stepId: string) => {
    const updated = await codeIntelligenceService.completeOnboardingStep(repoId, stepId);
    if (updated) {
      setOnboardingJourney(updated);
    }
  };

  const handleToggleLearningStep = async (stepId: string) => {
    const updated = await codeIntelligenceService.toggleLearningPathStep(repoId, stepId);
    if (updated) {
      setLearningPath(updated);
    }
  };

  const handleDismissHealthInsight = async (insightId: string) => {
    const updated = await codeIntelligenceService.dismissHealthInsight(repoId, insightId);
    if (updated) {
      setHealthScore(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Metadata Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <Link
            href="/repositories"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Repositories
          </Link>

          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {repoId}
            </h1>
            <span className="font-mono text-[10px] uppercase font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-md border border-[var(--primary)]/20">
              {repoId === "sample-project" ? "Sample Project" : "Indexed Repository"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/architecture"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] font-bold text-[var(--primary)] hover:underline"
          >
            <GitBranch className="w-3.5 h-3.5" />
            View Architecture Graph
          </Link>
        </div>
      </div>

      {/* Indexing Status and Repository Metadata Panel (Section 8) */}
      {repoId !== "sample-project" && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--text-primary)]">
                  {repoMetadata ? `${repoMetadata.owner}/${repoMetadata.name}` : repoId}
                </span>
                <span className="font-mono text-[10px] text-[var(--text-secondary)] bg-[var(--border-color)]/30 px-2 py-0.5 rounded">
                  Branch: {repoMetadata?.defaultBranch || "main"}
                </span>
                {repoMetadata?.commitSha && (
                  <span className="font-mono text-[10px] text-[var(--text-secondary)] bg-[var(--border-color)]/30 px-2 py-0.5 rounded">
                    Commit: {repoMetadata.commitSha.slice(0, 7)}
                  </span>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <strong className="text-[var(--text-primary)]">{repoMetadata?.fileCount || treeFiles.length}</strong> files discovered
                </span>
                <span>•</span>
                <span>
                  <strong className="text-[var(--text-primary)]">{repoMetadata?.symbolCount || 0}</strong> AST symbols indexed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  repoMetadata?.status === "ready"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : repoMetadata?.status === "indexing"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                    : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                }`}
              >
                {repoMetadata?.status === "ready" && <CheckCircle2 className="w-3 h-3" />}
                {repoMetadata?.status === "indexing" && <RefreshCw className="w-3 h-3 animate-spin" />}
                {repoMetadata?.currentStage || (repoMetadata?.status === "ready" ? "Indexed" : "Ready")}
              </span>

              <button
                type="button"
                onClick={handleTriggerReindex}
                disabled={isReindexing}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isReindexing ? "animate-spin" : ""}`} />
                {isReindexing ? "Re-indexing..." : "Re-index Codebase"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Mode Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setMainTab("code")}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl transition-all whitespace-nowrap ${
            mainTab === "code"
              ? isDark
                ? "bg-[#29D3C2] text-[#070A12] shadow-sm font-black"
                : "bg-[#6C4DFF] text-white shadow-sm font-black"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Code & Symbol Explorer</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("report")}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl transition-all whitespace-nowrap ${
            mainTab === "report"
              ? isDark
                ? "bg-[#29D3C2] text-[#070A12] shadow-sm font-black"
                : "bg-[#6C4DFF] text-white shadow-sm font-black"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Report</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("onboarding")}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl transition-all whitespace-nowrap ${
            mainTab === "onboarding"
              ? isDark
                ? "bg-[#29D3C2] text-[#070A12] shadow-sm font-black"
                : "bg-[#6C4DFF] text-white shadow-sm font-black"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Onboarding Guide</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("learning")}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl transition-all whitespace-nowrap ${
            mainTab === "learning"
              ? isDark
                ? "bg-[#29D3C2] text-[#070A12] shadow-sm font-black"
                : "bg-[#6C4DFF] text-white shadow-sm font-black"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Learning Curriculum</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("workflow")}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl transition-all whitespace-nowrap ${
            mainTab === "workflow"
              ? isDark
                ? "bg-[#29D3C2] text-[#070A12] shadow-sm font-black"
                : "bg-[#6C4DFF] text-white shadow-sm font-black"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>Workflow Trace</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("health")}
          className={`flex items-center gap-2 py-2 px-3.5 rounded-xl transition-all whitespace-nowrap ${
            mainTab === "health"
              ? isDark
                ? "bg-[#29D3C2] text-[#070A12] shadow-sm font-black"
                : "bg-[#6C4DFF] text-white shadow-sm font-black"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Codebase Health</span>
        </button>
      </div>

      {/* VIEW TAB 1: CODE & SYMBOL EXPLORER */}
      {mainTab === "code" && (
        <div className="space-y-4">
          {/* Mobile/Tablet View Switcher (< lg) */}
          <div className="flex lg:hidden gap-1 p-1 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <button
              type="button"
              onClick={() => setActivePanelTab("files")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activePanelTab === "files"
                  ? isDark
                    ? "bg-[#29D3C2] text-[#070A12]"
                    : "bg-[#6C4DFF] text-white"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Files
            </button>
            <button
              type="button"
              onClick={() => setActivePanelTab("code")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activePanelTab === "code"
                  ? isDark
                    ? "bg-[#29D3C2] text-[#070A12]"
                    : "bg-[#6C4DFF] text-white"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Source Code
            </button>
            <button
              type="button"
              onClick={() => setActivePanelTab("assistant")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activePanelTab === "assistant"
                  ? isDark
                    ? "bg-[#29D3C2] text-[#070A12]"
                    : "bg-[#6C4DFF] text-white"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              AI Assistant
            </button>
          </div>

          {/* 3 Coordinated Panels Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[640px] items-stretch">
            {/* Panel A: File Explorer (Desktop: col-span-3) */}
            <div
              className={`lg:col-span-3 rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col ${
                activePanelTab !== "files" ? "hidden lg:flex" : "flex"
              }`}
            >
              <RepositoryFileTree
                files={treeFiles}
                selectedFilePath={selectedFilePath}
                onSelectFile={handleSelectFile}
                rootLabel={repoId}
              />
            </div>

            {/* Panel B: Source Code Viewer with Symbol Navigation (Desktop: col-span-5) */}
            <div
              className={`lg:col-span-5 rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col ${
                activePanelTab !== "code" ? "hidden lg:flex" : "flex"
              }`}
            >
              <SourceCodeViewer
                filePath={selectedFilePath}
                code={fileContent.code}
                language={fileContent.language}
                highlightRange={highlightRange}
                onLineClick={(line) => setHighlightRange([line, line])}
                repoId={repoId}
                onNavigateTarget={handleNavigateTarget}
              />
            </div>

            {/* Panel C: Contextual AI Assistant (Desktop: col-span-4) */}
            <div
              className={`lg:col-span-4 rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm flex flex-col ${
                activePanelTab !== "assistant" ? "hidden lg:flex" : "flex"
              }`}
            >
              <AssistantWorkspace
                selectedFilePath={selectedFilePath}
                onCitationClick={handleCitationClick}
                repoId={repoId}
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: KNOWLEDGE REPORT */}
      {mainTab === "report" && (
        <div>
          {onboardingOverview ? (
            <KnowledgeReportView
              overview={onboardingOverview}
              onRefresh={handleRefreshReport}
              onNavigateFile={handleNavigateTarget}
              isRefreshing={isRefreshingReport}
            />
          ) : (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-secondary)]">
              Generating Knowledge & Architecture Report...
            </div>
          )}
        </div>
      )}

      {/* VIEW TAB 3: ONBOARDING GUIDE */}
      {mainTab === "onboarding" && (
        <div className="space-y-6">
          {onboardingJourney ? (
            <OnboardingGuidedJourney
              journey={onboardingJourney}
              onCompleteStep={handleCompleteOnboardingStep}
              onNavigateAction={(url) => {
                if (url.includes("tab=workflow")) {
                  setMainTab("workflow");
                } else if (url.includes("tab=overview")) {
                  setMainTab("report");
                } else if (url.includes("tab=learning")) {
                  setMainTab("learning");
                } else if (url.includes("assistant")) {
                  router.push(url);
                } else {
                  const match = url.match(/file=([^&]+)(?:&line=(\d+))?/);
                  if (match) {
                    const decoded = decodeURIComponent(match[1]);
                    const l = match[2] ? parseInt(match[2], 10) : undefined;
                    handleNavigateTarget(decoded, l);
                  }
                }
              }}
            />
          ) : (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-secondary)]">
              Loading onboarding journey...
            </div>
          )}
        </div>
      )}

      {/* VIEW TAB 4: LEARNING CURRICULUM */}
      {mainTab === "learning" && (
        <div className="space-y-6">
          {learningPath ? (
            <LearningPathView
              learningPath={learningPath}
              onToggleStep={handleToggleLearningStep}
              onNavigateFile={handleNavigateTarget}
            />
          ) : (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-secondary)]">
              Generating repository learning path...
            </div>
          )}
        </div>
      )}

      {/* VIEW TAB 4: WORKFLOW TRACE */}
      {mainTab === "workflow" && (
        <div>
          {workflowData ? (
            <WorkflowTraceViewer
              trace={workflowData.trace}
              availableEntryPoints={workflowData.availableEntryPoints}
              selectedEntryPoint={selectedEntryPoint}
              onSelectEntryPoint={setSelectedEntryPoint}
              onNavigateFile={handleNavigateTarget}
            />
          ) : (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-secondary)]">
              Tracing architectural execution path...
            </div>
          )}
        </div>
      )}

      {/* VIEW TAB 5: CODEBASE HEALTH */}
      {mainTab === "health" && (
        <div>
          {healthScore ? (
            <HealthInsightsView
              healthScore={healthScore}
              onDismissInsight={handleDismissHealthInsight}
              onNavigateFile={handleNavigateTarget}
            />
          ) : (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-secondary)]">
              Calculating architectural coupling metrics and test linkages...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RepositoryDetailPageClient() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-[var(--text-secondary)]">Loading Repository Explorer...</div>}>
      <RepositoryExplorerContent />
    </Suspense>
  );
}
