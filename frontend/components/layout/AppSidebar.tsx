"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { useTheme } from "@/hooks/useTheme";
import { MAIN_NAVIGATION } from "@/lib/navigation";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Settings as SettingsIcon,
} from "lucide-react";
import WorkspaceSwitcher from "@/components/workspace/WorkspaceSwitcher";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();

  const userInitials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "DV";

  const userDisplayEmail = user?.username ? `@${user.username}` : user?.email || "developer@codeatlas.dev";

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-3.5 sm:p-4 overflow-hidden">
      {/* Top Header & Switcher */}
      <div className="shrink-0">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-1 mb-6`}>
          <Link
            href="/"
            onClick={() => setMobileOpen?.(false)}
            aria-label="CodeAtlas home"
            className="flex items-center cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] group"
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

        {/* Workspace Switcher */}
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      {/* Scrollable Navigation Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 my-3 pr-1" aria-label="Sidebar Navigation">
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
                    ? "bg-[#7C5CFC]/15 text-[#A78BFA] font-bold"
                    : "bg-[#7C5CFC]/10 text-[#6C4DFF] font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? isDark
                        ? "text-[#A78BFA]"
                        : "text-[#6C4DFF]"
                      : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                  }`}
                />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </div>

              {!collapsed && item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-tight shrink-0 ${
                    item.badge === "Agentic"
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                      : item.badge === "AI"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pinned User Profile Card at Bottom */}
      <div className="shrink-0 pt-3 border-t border-[var(--border-color)] mt-auto">
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)]">
            <div className="flex items-center gap-2.5 min-w-0">
              {user?.avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.avatar}
                  alt={user.name || "User Avatar"}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full border border-[var(--border-color)] object-cover shrink-0"
                />
              ) : (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#7C5CFC]/15 font-bold text-xs text-[#7C5CFC] shrink-0">
                  {userInitials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {user?.name || "Developer"}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] truncate">
                  {userDisplayEmail}
                </p>
              </div>
            </div>

            <Link
              href="/settings"
              title="Settings"
              onClick={() => setMobileOpen?.(false)}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] shrink-0"
            >
              <SettingsIcon className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex justify-center">
            <Link
              href="/settings"
              title={`${user?.name || "User"} (${userDisplayEmail}) — Settings`}
              onClick={() => setMobileOpen?.(false)}
              className="grid h-8 w-8 place-items-center rounded-full bg-[#7C5CFC]/15 font-bold text-xs text-[#7C5CFC] hover:scale-105 transition-transform overflow-hidden"
            >
              {user?.avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.avatar}
                  alt={user.name || "User"}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{userInitials}</span>
              )}
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sticky Sidebar */}
      <aside
        className={`hidden lg:flex flex-col sticky top-0 h-screen shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-surface)] transition-[width] duration-300 z-30 ${
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
