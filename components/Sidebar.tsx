"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useTheme } from "./ThemeProvider";
import {
  LayoutDashboard,
  FolderGit2,
  ScanSearch,
  Sparkles,
  Network,
  GitCompare,
  History,
  Settings,
  CheckCircle2,
  X,
  ChevronRight,
} from "lucide-react";
import { Github } from "@/components/Icons";
import { useState } from "react";

export const NAV_ITEMS = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Repositories", href: "/repositories", icon: FolderGit2 },
  { name: "Visual Code Explorer", href: "/visual-code-explorer", icon: ScanSearch },
  { name: "AI Assistant", href: "/assistant", icon: Sparkles },
  { name: "Architecture Graph", href: "/architecture", icon: Network, altHref: "/city-map" },
  { name: "Change Impact", href: "/impact", icon: GitCompare },
  { name: "Recent Activity", href: "/activity", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({
  mobileOpen = false,
  setMobileOpen,
}: {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}) {
  const path = usePathname();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [githubConnected, setGithubConnected] = useState(false);

  const toggleGithub = () => {
    setGithubConnected(!githubConnected);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        {/* Logo and close button for mobile */}
        <div className="flex items-center justify-between px-2 mb-6">
          <Link href="/" className="block">
            <Logo size="md" />
          </Link>
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--border-color)]/40"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              path === item.href ||
              (item.altHref && path === item.altHref) ||
              (item.href !== "/dashboard" && path.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen?.(false)}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? isDark
                      ? "bg-[#111725] text-[#29D3C2] border border-[#242B39] shadow-[0_0_15px_-4px_rgba(41,211,194,0.25)]"
                      : "bg-[#EAE5FF] text-[#6C4DFF] font-bold"
                    : isDark
                    ? "text-[#9AA4B5] hover:bg-[#111725] hover:text-[#F3F5FA]"
                    : "text-[#68677D] hover:bg-[#FAF9FF] hover:text-[#19143D]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? isDark
                          ? "text-[#29D3C2]"
                          : "text-[#6C4DFF]"
                        : "text-[var(--text-secondary)] group-hover:text-current"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isDark ? "bg-[#29D3C2]" : "bg-[#6C4DFF]"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* GitHub Connection Status Area (as specified in PDF 2 & 1) */}
      <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
        <div
          className={`rounded-2xl p-4 border transition-all ${
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
              <Github className="w-4 h-4" />
              <span className="text-xs font-bold">
                {githubConnected ? "GitHub Connected" : "GitHub not connected"}
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
              ? "Access to 4 repositories enabled."
              : "Connect to analyze private repositories."}
          </p>
          <button
            onClick={toggleGithub}
            className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              githubConnected
                ? "border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:text-red-500"
                : isDark
                ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                : "bg-[#19143D] text-white hover:bg-[#2a225f]"
            }`}
          >
            {githubConnected ? "Disconnect" : "Connect GitHub"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-surface)] transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen?.(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[var(--bg-surface)] border-r border-[var(--border-color)] transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
