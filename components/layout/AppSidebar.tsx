"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { useTheme } from "@/hooks/useTheme";
import { MAIN_NAVIGATION } from "@/lib/navigation";
import { Github } from "@/components/Icons";
import {
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
} from "lucide-react";
import WorkspaceSwitcher from "@/components/workspace/WorkspaceSwitcher";

export interface AppSidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

export default function AppSidebar({
  mobileOpen = false,
  setMobileOpen,
  collapsed = false,
  setCollapsed,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [githubConnected, setGithubConnected] = useState(false);

  const toggleGithub = () => {
    setGithubConnected((prev) => !prev);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 overflow-y-auto overflow-x-hidden">
      <div>
        {/* Top Header: Logo + Collapse/Close button */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-1 mb-6`}>
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen?.(false)}
            aria-label="CodeAtlas Home"
            className="flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            {collapsed ? (
              <Logo size="sm" showText={false} />
            ) : (
              <Logo size="md" showText={true} />
            )}
          </Link>

          {/* Desktop collapse toggle */}
          {setCollapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden lg:flex items-center justify-center h-8 w-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Mobile close button */}
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Phase 14: Workspace Switcher */}
        <WorkspaceSwitcher collapsed={collapsed} />

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Sidebar Navigation">
          {MAIN_NAVIGATION.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.altHref && pathname === item.altHref) ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen?.(false)}
                title={collapsed ? item.name : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex items-center ${
                  collapsed ? "justify-center px-2" : "justify-between px-3.5"
                } py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                  isActive
                    ? isDark
                      ? "bg-[#111725] text-[#29D3C2] border border-[#242B39] shadow-[0_0_15px_-4px_rgba(41,211,194,0.3)]"
                      : "bg-[#EAE5FF] text-[#6C4DFF] font-bold border border-[#DDD5FE]"
                    : isDark
                    ? "text-[#9AA4B5] hover:bg-[#111725]/80 hover:text-[#F3F5FA]"
                    : "text-[#5A5C5E] hover:bg-[#FAF9FF] hover:text-[#1E2022]"
                }`}
              >
                <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? isDark
                          ? "text-[#29D3C2]"
                          : "text-[#6C4DFF]"
                        : "text-[var(--text-secondary)] group-hover:text-current"
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </div>

                {!collapsed && isActive && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      isDark ? "bg-[#29D3C2] shadow-[0_0_8px_#29D3C2]" : "bg-[#6C4DFF]"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: GitHub Status + User Profile Card */}
      <div className="mt-6 pt-4 border-t border-[var(--border-color)] space-y-3">
        {/* GitHub Connection Status */}
        {!collapsed ? (
          <div
            className={`rounded-2xl p-3.5 border transition-all ${
              githubConnected
                ? isDark
                  ? "bg-[#111725] border-[#29D3C2]/40"
                  : "bg-[#D7F7EA]/50 border-[#2FD6A0]"
                : isDark
                ? "bg-[#0A0F19] border-[#242B39]"
                : "bg-[#FAF9FF] border-[#E8E5F4]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-[var(--text-primary)]" />
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {githubConnected ? "GitHub Connected" : "GitHub Status"}
                </span>
              </div>
              {githubConnected ? (
                <CheckCircle2 className="w-4 h-4 text-[#2FD6A0]" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-[#FF5A5F]" />
              )}
            </div>

            <p className="mt-1.5 text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed">
              {githubConnected
                ? "4 sample repos linked. AST indexing active."
                : "Connect to analyze your repositories."}
            </p>

            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)]">
              <span>Prototype status</span>
              <span className="text-[var(--primary)] font-semibold">Demo mode</span>
            </div>

            <button
              type="button"
              onClick={toggleGithub}
              className={`mt-2.5 w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                githubConnected
                  ? "border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/50"
                  : isDark
                  ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                  : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
              }`}
            >
              {githubConnected ? "Disconnect" : "Connect GitHub"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={toggleGithub}
              title={githubConnected ? "GitHub Connected (Click to disconnect)" : "Connect GitHub (Prototype)"}
              className={`p-2.5 rounded-xl border transition-all ${
                githubConnected
                  ? isDark
                    ? "bg-[#111725] border-[#29D3C2] text-[#29D3C2]"
                    : "bg-[#D7F7EA] border-[#2FD6A0] text-[#1BA97B]"
                  : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Github className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User Profile Card & Settings Shortcut */}
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#FFE08A] font-bold text-xs text-[#1E2022] shrink-0">
                AM
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                  Alex Mercer
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] truncate">
                  alex@codeatlas.dev
                </p>
              </div>
            </div>

            <Link
              href="/settings"
              title="Settings shortcut"
              onClick={() => setMobileOpen?.(false)}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <Link
              href="/settings"
              title="Alex Mercer (alex@codeatlas.dev) — Settings"
              onClick={() => setMobileOpen?.(false)}
              className="grid h-8 w-8 place-items-center rounded-full bg-[#FFE08A] font-bold text-xs text-[#1E2022] hover:scale-105 transition-transform"
            >
              AM
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-surface)] transition-[width] duration-300 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen?.(false)}
          aria-hidden="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        role="dialog"
        aria-label="Mobile Navigation"
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[var(--bg-surface)] border-r border-[var(--border-color)] transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
