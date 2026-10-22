"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import City from "@/components/City";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Network,
  Building2,
  ExternalLink,
  Code2,
  FileCode,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
  Share2,
  Maximize2,
} from "lucide-react";

interface NodeDetail {
  id: string;
  name: string;
  type: string;
  file: string;
  lines: string;
  description: string;
  code: string;
  callers: string[];
  callees: string[];
  tests: string[];
}

const NODES_DATA: Record<string, NodeDetail> = {
  auth: {
    id: "auth",
    name: "auth.py / authorize()",
    type: "Core Function",
    file: "src/auth.py",
    lines: "14 to 18",
    description: "login() lines 14 to 18. Called by POST /auth, calls UserService, covered by test_auth.py.",
    code: `def login(email, pw):
    user = db.find(email)
    if not user:
        raise AuthError()
    return verify(user, pw)`,
    callers: ["POST /auth", "LoginForm.tsx"],
    callees: ["UserService", "verify()"],
    tests: ["test_auth.py:test_login_ok()"],
  },
  api: {
    id: "api",
    name: "POST /auth",
    type: "API Route",
    file: "src/api/routes.py",
    lines: "8 to 15",
    description: "Routes that connect the client login form to the authorization core backend.",
    code: `@router.post("/auth")
async def handle_login(req: Request):
    return auth.login(req.email, req.password)`,
    callers: ["LoginForm.tsx"],
    callees: ["auth.py:authorize()"],
    tests: ["test_auth.py:test_api_route()"],
  },
  login: {
    id: "login",
    name: "LoginForm.tsx",
    type: "Component",
    file: "src/LoginForm.tsx",
    lines: "1 to 24",
    description: "Client login form. Submits user email & password credentials to POST /auth.",
    code: `const res = await fetch("/api/auth", {
  method: "POST",
  body: JSON.stringify({ email, pw }),
});`,
    callers: ["User Browser"],
    callees: ["POST /auth"],
    tests: ["LoginForm.test.tsx"],
  },
  service: {
    id: "service",
    name: "UserService",
    type: "Service",
    file: "src/services/UserService.ts",
    lines: "5 to 20",
    description: "Looks up users in the database and creates authenticated session records.",
    code: `class UserService:
    def find(self, email):
        return db.query("SELECT * FROM users WHERE email = %s", email)`,
    callers: ["auth.py:authorize()"],
    callees: ["users table"],
    tests: ["UserService.test.ts"],
  },
  db: {
    id: "db",
    name: "users table",
    type: "Database Storage",
    file: "schema.sql",
    lines: "10 to 18",
    description: "PostgreSQL table storing user profiles, hashed credentials, and role permissions.",
    code: `CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255)
);`,
    callers: ["UserService"],
    callees: [],
    tests: ["db_migration_test.py"],
  },
  tests: {
    id: "tests",
    name: "test_auth.py",
    type: "Test Suite",
    file: "tests/test_auth.py",
    lines: "1 to 14",
    description: "Unit and integration tests that verify auth.py login logic and error conditions.",
    code: `def test_login_ok():
    user = create_mock_user()
    token = login(user.email, "secret")
    assert token is not None`,
    callers: ["CI Test Runner"],
    callees: ["auth.py:authorize()"],
    tests: ["pytest runner"],
  },
};

export default function ArchitecturePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [selectedNode, setSelectedNode] = useState("auth");
  const [viewStyle, setViewStyle] = useState<"graph" | "city">("graph");

  const currentNode = NODES_DATA[selectedNode] || NODES_DATA.auth;

  const handleOpenSource = () => {
    router.push("/assistant");
  };

  return (
    <div>
      <PageHeader
        title="Architecture Graph"
        sub={isDark ? "Sample graph shown for design purposes" : "my-project · City map · sample content for design"}
      />

      {/* Control bar: View Style Switcher & Graph Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 rounded-2xl p-1 border border-[var(--border-color)] bg-[var(--bg-surface)]">
          <button
            onClick={() => setViewStyle("graph")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewStyle === "graph"
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] shadow-sm"
                  : "bg-[#6C4DFF] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Graph View
          </button>
          <button
            onClick={() => setViewStyle("city")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewStyle === "city"
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] shadow-sm"
                  : "bg-[#6C4DFF] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            City Map View
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
          <span>Click any node or building to inspect call relationships</span>
        </div>
      </div>

      {/* Main Canvas & Detail Sidebar Grid */}
      <div className="grid gap-6 lg:grid-cols-12 min-h-[580px]">
        {/* Canvas (8 cols) */}
        <div
          className={`lg:col-span-8 app-card p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
          }`}
        >
          {/* Canvas Sub-Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                Repository AST: 6 Symbols · 5 Edges
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] bg-[var(--border-color)]/40 px-2 py-0.5 rounded">
              Interactive Canvas
            </span>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="my-auto py-4">
            <City
              selected={selectedNode}
              onPick={setSelectedNode}
              className="w-full max-h-[460px] mx-auto"
              forceMode={viewStyle === "city" ? "light" : "graph"}
            />
          </div>

          {/* Canvas Footer */}
          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Selected: <strong className="text-[var(--text-primary)]">{currentNode.name}</strong></span>
            <span className="font-mono text-[10px]">Panned & Scaled 100%</span>
          </div>
        </div>

        {/* Selected Node / Building Panel (4 cols - matching PDF 1 Page 4 & PDF 2 Page 6) */}
        <aside
          className={`lg:col-span-4 app-card p-6 flex flex-col justify-between ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--primary)] font-bold">
                {viewStyle === "city" ? "SELECTED BUILDING" : "SELECTED NODE"}
              </span>
              <span className="font-mono text-[10px] text-[var(--text-secondary)] bg-[var(--border-color)]/50 px-2 py-0.5 rounded">
                {currentNode.type}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
              {currentNode.name}
            </h2>

            <p className="mt-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
              {currentNode.description}
            </p>

            {/* Source Reference & Line Range */}
            <div className="mt-4 p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] text-xs">
              <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block mb-1">
                Source Location
              </span>
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-[var(--text-primary)]">{currentNode.file}</span>
                <span className="text-[var(--primary)] font-semibold">Lines {currentNode.lines}</span>
              </div>
            </div>

            {/* Code Snippet Preview */}
            <div className="mt-4">
              <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block mb-1.5">
                AST Implementation Snippet
              </span>
              <pre
                className={`p-3.5 rounded-2xl overflow-x-auto font-mono text-xs leading-5 border ${
                  isDark
                    ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA]"
                    : "bg-[#FAF9FF] border-[#E8E5F4] text-[#19143D]"
                }`}
              >
                {currentNode.code}
              </pre>
            </div>

            {/* Graph Connections */}
            <div className="mt-4 space-y-2 text-xs">
              {currentNode.callers.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                    Called By (Incoming):
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentNode.callers.map((c) => (
                      <span
                        key={c}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--bg-page)] border border-[var(--border-color)]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentNode.callees.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                    Calls (Outgoing):
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentNode.callees.map((c) => (
                      <span
                        key={c}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--bg-page)] border border-[var(--border-color)]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Open Source Action Button */}
          <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
            <button
              onClick={handleOpenSource}
              className={`w-full py-3 px-5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                isDark
                  ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                  : "bg-[#19143D] text-white hover:bg-[#2a225f]"
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              Open source
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
