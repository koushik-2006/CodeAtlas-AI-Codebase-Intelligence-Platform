"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/components/ThemeProvider";
import {
  GitCompare,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Layers,
  ArrowRight,
  ShieldAlert,
  TestTube2,
  Globe,
  Sparkles,
  Info,
} from "lucide-react";

interface ImpactResult {
  symbol: string;
  file: string;
  riskLevel: "High" | "Medium" | "Low";
  riskScore: number;
  affectedEndpoints: { method: string; path: string; file: string }[];
  affectedComponents: { name: string; file: string; callerLine: number }[];
  affectedServices: { name: string; file: string }[];
  testsToRerun: { name: string; file: string; status: "passing" | "needs-update" }[];
  recommendation: string;
}

const PRESET_SYMBOLS: Record<string, ImpactResult> = {
  "auth.py:login": {
    symbol: "login(email, pw)",
    file: "src/auth.py:14-18",
    riskLevel: "High",
    riskScore: 82,
    affectedEndpoints: [
      { method: "POST", path: "/auth/login", file: "src/api/routes.py" },
      { method: "POST", path: "/auth/refresh", file: "src/api/routes.py" },
    ],
    affectedComponents: [
      { name: "LoginForm.tsx", file: "src/LoginForm.tsx", callerLine: 12 },
      { name: "Navbar.tsx", file: "src/components/Navbar.tsx", callerLine: 34 },
    ],
    affectedServices: [
      { name: "UserService", file: "src/services/UserService.ts" },
    ],
    testsToRerun: [
      { name: "test_login_ok", file: "tests/test_auth.py", status: "needs-update" },
      { name: "test_login_invalid_password", file: "tests/test_auth.py", status: "needs-update" },
      { name: "LoginForm.test.tsx", file: "tests/LoginForm.test.tsx", status: "passing" },
    ],
    recommendation: "Modifying parameter signature or return type will break POST /auth/login and invalidate 2 unit tests.",
  },
  "UserService:find": {
    symbol: "UserService.find(email)",
    file: "src/services/UserService.ts:5-12",
    riskLevel: "Medium",
    riskScore: 54,
    affectedEndpoints: [
      { method: "POST", path: "/auth/login", file: "src/api/routes.py" },
    ],
    affectedComponents: [],
    affectedServices: [
      { name: "auth.py", file: "src/auth.py" },
    ],
    testsToRerun: [
      { name: "test_user_service_lookup", file: "tests/test_service.py", status: "passing" },
    ],
    recommendation: "Internal service method change. Only src/auth.py is directly impacted.",
  },
};

export default function ImpactPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [selectedRepo, setSelectedRepo] = useState("my-project");
  const [targetSymbol, setTargetSymbol] = useState("auth.py:login");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(true);

  const currentResult = PRESET_SYMBOLS[targetSymbol] || PRESET_SYMBOLS["auth.py:login"];

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setHasAnalyzed(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }, 700);
  };

  return (
    <div>
      <PageHeader
        title="Change Impact Analysis"
        sub="Identify potentially affected files, APIs, services, and tests before editing code."
      />

      {/* Input Selection Card */}
      <div
        className={`app-card p-6 mb-8 ${
          isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 flex-1 max-w-2xl">
            {/* Repository selector */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                Target Repository
              </label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                  isDark
                    ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA]"
                    : "bg-white border-[#E8E5F4] text-[#19143D]"
                }`}
              >
                <option value="my-project">my-project (Active)</option>
                <option value="ecommerce-platform">ecommerce-platform</option>
                <option value="auth-service">auth-service</option>
              </select>
            </div>

            {/* Target symbol picker */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                Target Symbol or File
              </label>
              <select
                value={targetSymbol}
                onChange={(e) => setTargetSymbol(e.target.value)}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-medium border outline-none ${
                  isDark
                    ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA]"
                    : "bg-white border-[#E8E5F4] text-[#19143D]"
                }`}
              >
                <option value="auth.py:login">auth.py → login(email, pw)</option>
                <option value="UserService:find">UserService.ts → find(email)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${
              isDark
                ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                : "bg-[#6C4DFF] text-white hover:bg-[#5838e6]"
            }`}
          >
            {isAnalyzing ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <GitCompare className="w-4 h-4" />
            )}
            {isAnalyzing ? "Analyzing Call Graph..." : "Calculate Impact"}
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Info className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span>
            Prototype demonstration: Risk scores and downstream dependency graphs are simulated from AST symbol index.
          </span>
        </div>
      </div>

      {/* Analysis Output Results */}
      {hasAnalyzed && currentResult && (
        <div className="space-y-6">
          {/* Summary Metric Strip */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Risk Card */}
            <div
              className={`app-card p-5 ${
                currentResult.riskLevel === "High"
                  ? isDark
                    ? "bg-[#FF5A5F]/10 border-[#FF5A5F]/40"
                    : "bg-[#FFE0E3] border-[#FF9A9C]"
                  : isDark
                  ? "bg-[#F3C969]/10 border-[#F3C969]/40"
                  : "bg-[#FFF0BF] border-[#FFE08A]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
                  IMPACT SEVERITY
                </span>
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">{currentResult.riskLevel} Risk</span>
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  Score {currentResult.riskScore}/100
                </span>
              </div>
            </div>

            {/* Affected Endpoints */}
            <div
              className={`app-card p-5 ${
                isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
              }`}
            >
              <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
                AFFECTED APIS
              </span>
              <p className="mt-3 text-3xl font-extrabold">
                {currentResult.affectedEndpoints.length} Routes
              </p>
            </div>

            {/* Affected Frontend UI */}
            <div
              className={`app-card p-5 ${
                isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
              }`}
            >
              <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
                CLIENT COMPONENTS
              </span>
              <p className="mt-3 text-3xl font-extrabold">
                {currentResult.affectedComponents.length} Files
              </p>
            </div>

            {/* Tests to Re-Run */}
            <div
              className={`app-card p-5 ${
                isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
              }`}
            >
              <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
                TESTS TO RE-RUN
              </span>
              <p className="mt-3 text-3xl font-extrabold">
                {currentResult.testsToRerun.length} Suites
              </p>
            </div>
          </div>

          {/* Detailed Impact Breakdown Grids */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Affected Callers & APIs */}
            <div
              className={`app-card p-6 ${
                isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
              }`}
            >
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--primary)]" />
                Impacted API Endpoints & Call Sites
              </h3>

              <div className="mt-4 space-y-3">
                {currentResult.affectedEndpoints.map((ep) => (
                  <div
                    key={ep.path}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                          {ep.method}
                        </span>
                        <span className="font-mono text-xs font-bold">{ep.path}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--text-secondary)] mt-1 block">
                        Defined in: {ep.file}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-red-500">Breakage Risk</span>
                  </div>
                ))}

                {currentResult.affectedComponents.map((comp) => (
                  <div
                    key={comp.name}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold">{comp.name}</span>
                      <span className="font-mono text-[11px] text-[var(--text-secondary)] mt-1 block">
                        {comp.file} (Line {comp.callerLine})
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[var(--text-secondary)]">Client UI</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Tests to Re-Run & Recommendation */}
            <div
              className={`app-card p-6 flex flex-col justify-between ${
                isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
              }`}
            >
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <TestTube2 className="w-4 h-4 text-[var(--primary)]" />
                  Test Verification Plan
                </h3>

                <div className="mt-4 space-y-2.5">
                  {currentResult.testsToRerun.map((t) => (
                    <div
                      key={t.name}
                      className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold">{t.name}</span>
                        <span className="font-mono text-[11px] text-[var(--text-secondary)] block">
                          {t.file}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          t.status === "needs-update"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-green-500/10 text-green-500"
                        }`}
                      >
                        {t.status === "needs-update" ? "Action Required" : "Passing"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation Callout */}
              <div className="mt-6 p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)]">
                <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wide block mb-1">
                  AI Engineering Recommendation
                </span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {currentResult.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
