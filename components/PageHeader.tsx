"use client";

import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "./ThemeProvider";
import { Search, Menu, User, Sparkles, FileCode, Check, Bell, LogOut } from "lucide-react";
import Link from "next/link";

export default function PageHeader({
  title,
  sub,
  onMenuClick,
}: {
  title: string;
  sub: string;
  onMenuClick?: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const sampleResults = [
    { name: "auth.py", type: "file", path: "src/auth.py", line: "def login(email, pw):" },
    { name: "LoginForm.tsx", type: "component", path: "src/components/LoginForm.tsx", line: "export default LoginForm" },
    { name: "UserService", type: "service", path: "src/services/UserService.ts", line: "class UserService" },
    { name: "POST /auth", type: "api", path: "src/api/routes.py", line: "@router.post('/auth')" },
    { name: "test_auth.py", type: "test", path: "tests/test_auth.py", line: "def test_login_ok():" },
  ].filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.line.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="relative mb-8 pb-4 border-b border-[var(--border-color)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Mobile hamburger & Titles */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
              {sub}
            </p>
          </div>
        </div>

        {/* Right: Search, ThemeToggle & Profile */}
        <div className="flex items-center gap-3">
          {/* Search bar with realistic prototype results */}
          <div className="relative flex-1 sm:w-72 lg:w-80">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                placeholder="Search code, files, symbols"
                aria-label="Search code, files, symbols"
                className={`w-full pl-10 pr-9 py-2.5 rounded-full text-xs sm:text-sm font-medium outline-none transition-all duration-200 border ${
                  isDark
                    ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] placeholder-[#9AA4B5]/60 focus:border-[#29D3C2] focus:shadow-[0_0_15px_-3px_rgba(41,211,194,0.3)]"
                    : "bg-white border-[#E8E5F4] text-[#19143D] placeholder-[#68677D]/60 focus:border-[#6C4DFF] focus:shadow-soft"
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--border-color)]/50">
                /
              </span>
            </div>

            {/* Search Dropdown Results */}
            {showResults && searchQuery && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowResults(false)}
                />
                <div
                  className={`absolute left-0 right-0 mt-2 z-40 rounded-2xl border p-2 shadow-2xl ${
                    isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
                  }`}
                >
                  <div className="px-3 py-1.5 text-[11px] font-mono uppercase text-[var(--text-secondary)]">
                    Matching Symbols & Files
                  </div>
                  {sampleResults.length > 0 ? (
                    <div className="space-y-1">
                      {sampleResults.map((res) => (
                        <Link
                          key={res.name}
                          href="/assistant"
                          onClick={() => setShowResults(false)}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                            isDark ? "hover:bg-[#111725]" : "hover:bg-[#FAF9FF]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-[var(--primary)]" />
                            <div>
                              <span className="font-bold">{res.name}</span>
                              <span className="ml-2 font-mono text-[10px] text-[var(--text-secondary)]">
                                {res.path}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">
                            {res.type}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-[var(--text-secondary)]">
                      No matching symbols found.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile Avatar with dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="User profile menu"
              className="grid h-10 w-10 place-items-center rounded-full bg-sun font-bold text-[#19143D] shadow-sm hover:scale-105 transition-transform"
            >
              U
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div
                  className={`absolute right-0 mt-2 w-48 z-40 rounded-2xl border p-2 shadow-2xl ${
                    isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
                  }`}
                >
                  <div className="px-3 py-2 border-b border-[var(--border-color)]">
                    <p className="text-xs font-bold">User Developer</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">developer@codeatlas.dev</p>
                  </div>
                  <div className="space-y-0.5 pt-1">
                    <Link
                      href="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--border-color)]/40 transition-colors"
                    >
                      Profile Settings
                    </Link>
                    <Link
                      href="/repositories"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--border-color)]/40 transition-colors"
                    >
                      My Repositories
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
