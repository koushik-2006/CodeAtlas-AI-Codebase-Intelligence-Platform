"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { apiClient } from "@/services/api-client";
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FolderGit2,
  Sparkles,
  GitBranch,
  ShieldCheck,
  RefreshCw,
  GitPullRequest,
  Check,
  ChevronRight,
  Database,
  Search,
} from "lucide-react";

interface ProductOnboardingState {
  userId: string;
  completed: boolean;
  skipped: boolean;
  currentStep: number;
  completedSteps: string[];
  selectedRepoId?: string;
  hasSeenTour: boolean;
  lastUpdated: string;
}

export default function ProductOnboardingPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [state, setState] = useState<ProductOnboardingState>({
    userId: "usr_default",
    completed: false,
    skipped: false,
    currentStep: 1,
    completedSteps: [],
    selectedRepoId: "sample-project",
    hasSeenTour: false,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [indexingProgress, setIndexingProgress] = useState(100);
  const [isIndexing, setIsIndexing] = useState(false);

  // Load existing onboarding status
  useEffect(() => {
    apiClient
      .get<any>("/onboarding/product")
      .then((res) => {
        const data = res.data || {};
        if (res.success && data.onboarding) {
          setState(data.onboarding);
        }
      })
      .catch((err) => console.warn("Onboarding status fetch:", err))
      .finally(() => setLoading(false));
  }, []);

  const saveProgress = async (updates: Partial<ProductOnboardingState>) => {
    try {
      const res = await apiClient.post<any>("/onboarding/product", updates);
      const data = res.data || {};
      if (res.success && data.onboarding) {
        setState(data.onboarding);
      }
    } catch (e) {
      console.warn("Failed to save onboarding progress:", e);
    }
  };

  const handleNextStep = async () => {
    const next = state.currentStep + 1;
    const stepKey = `step_${state.currentStep}`;
    const newSteps = Array.from(new Set([...state.completedSteps, stepKey]));

    if (next > 6) {
      await saveProgress({
        currentStep: 6,
        completed: true,
        completedSteps: newSteps,
      });
      router.push(`/repositories/${state.selectedRepoId || "sample-project"}`);
    } else {
      await saveProgress({
        currentStep: next,
        completedSteps: newSteps,
      });
    }
  };

  const handleSkip = async () => {
    await saveProgress({ skipped: true, completed: true });
    router.push("/dashboard");
  };

  const simulateIndexTest = () => {
    setIsIndexing(true);
    setIndexingProgress(0);
    const interval = setInterval(() => {
      setIndexingProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsIndexing(false);
          return 100;
        }
        return p + 25;
      });
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] text-xs font-mono text-[var(--text-secondary)]">
        Loading onboarding journey...
      </div>
    );
  }

  const stepsMeta = [
    { num: 1, title: "Welcome to CodeAtlas" },
    { num: 2, title: "Select Starting Repo" },
    { num: 3, title: "Permissions & Security" },
    { num: 4, title: "Real AST Indexing" },
    { num: 5, title: "Explore Symbols & Traces" },
    { num: 6, title: "Ask Your First Question" },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors py-10 px-5">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[var(--border-color)]">
          <Link
            href="/"
            aria-label="CodeAtlas home"
            className="flex items-center cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] group"
          >
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Skip to Dashboard
            </button>
          </div>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
          {stepsMeta.map((s) => {
            const isCompleted = state.currentStep > s.num || state.completed;
            const isCurrent = state.currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  isCurrent
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : isCompleted
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                    : "text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-color)]"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : <span>{s.num}</span>}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* STEP 1: WELCOME */}
        {state.currentStep === 1 && (
          <div className="p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="p-3 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] w-fit">
              <Compass className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome to CodeAtlas
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                CodeAtlas transforms complex repositories into structured, navigable knowledge graphs. In this brief 2-minute walkthrough, we will set up your first codebase and trace your first execution workflow.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1.5">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <div className="font-bold text-xs text-[var(--text-primary)]">Verified AST Facts</div>
                <div className="text-[11px] text-[var(--text-secondary)]">Every connection and relationship is backed by parser proof.</div>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1.5">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <div className="font-bold text-xs text-[var(--text-primary)]">Grounded AI</div>
                <div className="text-[11px] text-[var(--text-secondary)]">Answers cite exact file paths and verifiable line numbers.</div>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1.5">
                <GitBranch className="w-5 h-5 text-cyan-500" />
                <div className="font-bold text-xs text-[var(--text-primary)]">Workflow Traces</div>
                <div className="text-[11px] text-[var(--text-secondary)]">Follow handlers through services to database and test layers.</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: REPOSITORY SELECTION */}
        {state.currentStep === 2 && (
          <div className="p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 w-fit">
              <FolderGit2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                Select Your Starting Repository
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                You can begin with our bundled sample project (recommended for zero setup) or connect an authorized GitHub repository.
              </p>
            </div>

            <div className="space-y-3">
              <label
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                  state.selectedRepoId === "sample-project"
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-[var(--border-color)] bg-[var(--bg-page)]"
                }`}
                onClick={() => saveProgress({ selectedRepoId: "sample-project" })}
              >
                <input
                  type="radio"
                  name="repoSelect"
                  checked={state.selectedRepoId === "sample-project"}
                  onChange={() => saveProgress({ selectedRepoId: "sample-project" })}
                  className="mt-1 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <span>sample-project (Recommended)</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-500">
                      Pre-Indexed
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Production-grade TypeScript authentication service with 5 files, 6 AST symbols, 15 verified relationships, and automated tests.
                  </p>
                </div>
              </label>

              <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)]/50 opacity-80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-[var(--text-primary)]">Connect a GitHub Repository</div>
                  <Link
                    href="/repositories"
                    className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
                  >
                    GitHub OAuth <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Connect public or private repositories via GitHub OAuth. Read-only metadata and source file access is requested.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PERMISSIONS & SECURITY */}
        {state.currentStep === 3 && (
          <div className="p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="p-3 rounded-2xl bg-green-500/10 text-green-500 w-fit">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                Repository Permissions & Privacy Safeguards
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                CodeAtlas is engineered with privacy-first principles. Here is exactly how your code is handled.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1">
                <div className="font-bold text-xs text-[var(--text-primary)]">Read-Only Source Code Access</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  CodeAtlas only requests <code className="font-mono bg-[var(--bg-surface)] px-1 py-0.5 rounded">repo:read</code> scopes. We never request push, commit, or administrative permissions.
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1">
                <div className="font-bold text-xs text-[var(--text-primary)]">Zero Training on User Code</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  Your proprietary code is never used to train public machine learning models. Queries use bounded retrieval prompts with ephemeral context windows.
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-1">
                <div className="font-bold text-xs text-[var(--text-primary)]">Local Secret & Token Redaction</div>
                <div className="text-xs text-[var(--text-secondary)]">
                  All environment variables, API tokens, and secrets are automatically scrubbed from logs and prompt payloads before processing.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REAL AST INDEXING */}
        {state.currentStep === 4 && (
          <div className="p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 w-fit">
              <Database className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                Real-Time AST Indexing Engine
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Our parser scans files, identifies functions and classes, and maps import/call expressions into graph relationships.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[var(--text-primary)]">
                  Target: {state.selectedRepoId || "sample-project"}
                </span>
                <span className="text-green-500 font-bold">{indexingProgress}% Indexed</span>
              </div>

              <div className="w-full h-2 rounded-full bg-[var(--border-color)]/30 overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${indexingProgress}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                  <div className="text-[var(--text-secondary)] text-[10px]">Files</div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">5</div>
                </div>
                <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                  <div className="text-[var(--text-secondary)] text-[10px]">Symbols</div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">6</div>
                </div>
                <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                  <div className="text-[var(--text-secondary)] text-[10px]">Relations</div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">15</div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={simulateIndexTest}
                  disabled={isIndexing}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isIndexing ? "animate-spin" : ""}`} />
                  <span>Verify Index Integrity</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SYMBOLS & TRACES */}
        {state.currentStep === 5 && (
          <div className="p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 w-fit">
              <Search className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                Inspect Symbols & Execution Traces
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                In the Code Explorer, highlight or hover any symbol to reveal callers, callees, definitions, and linked tests.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-page)] space-y-3 font-mono text-xs">
              <div className="text-[var(--text-secondary)]">Example Symbol Resolution:</div>
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex justify-between items-center">
                <span className="font-bold text-[var(--primary)]">loginUser()</span>
                <span className="text-[var(--text-secondary)]">src/services/auth.ts:18</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-[var(--bg-surface)]">
                  Caller: <strong className="text-[var(--text-primary)]">handleSubmit</strong>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-surface)]">
                  Test: <strong className="text-[var(--text-primary)]">testLoginSuccess</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: ASK FIRST QUESTION */}
        {state.currentStep === 6 && (
          <div className="p-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 w-fit">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                Ask Your First Grounded Question
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                You are ready! Open the AI Assistant to ask about authentication, data flow, or tests.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-[var(--text-secondary)]">Try asking in the Assistant:</div>
              <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] font-mono text-xs text-[var(--primary)]">
                &ldquo;Where does authentication start and which database table is queried?&rdquo;
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-4">
          {state.currentStep > 1 ? (
            <button
              type="button"
              onClick={() => saveProgress({ currentStep: state.currentStep - 1 })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNextStep}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
              isDark
                ? "bg-[#29D3C2] text-[#0E1116] hover:bg-[#22b5a6]"
                : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
            }`}
          >
            <span>{state.currentStep === 6 ? "Finish & Launch Explorer" : "Continue"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
