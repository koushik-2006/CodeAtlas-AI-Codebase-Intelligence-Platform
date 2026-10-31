"use client";
import { isDemoMode } from "@/lib/demo/mock-api";
import { X } from "lucide-react";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { workspaceService } from "@/services/workspace-service";
import { DbNotification } from "@/types/database";
import {
  Search,
  Menu,
  FileCode,
  FolderGit2,
  Bell,
  CheckCircle2,
  LogOut,
  Settings as SettingsIcon,
  Sparkles,
  Command,
  Check,
} from "lucide-react";

export interface AppHeaderProps {
  onMenuClick?: () => void;
}

const ROUTE_BREADCRUMBS: Record<string, { section: string; title: string }> = {
  "/dashboard": { section: "CodeAtlas", title: "Overview" },
  "/workspaces": { section: "CodeAtlas", title: "Team Workspaces" },
  "/repositories": { section: "CodeAtlas", title: "My Repositories" },
  "/multi-repo": { section: "CodeAtlas", title: "Multi-Repository Intelligence" },
  "/agents": { section: "CodeAtlas", title: "Agent Workspace" },
  "/visual-explorer": { section: "CodeAtlas", title: "Visual Code Explorer" },
  "/visual-code-explorer": { section: "CodeAtlas", title: "Visual Code Explorer" },
  "/assistant": { section: "CodeAtlas", title: "AI Assistant" },
  "/debug": { section: "CodeAtlas", title: "AI Debugger & Stack Trace" },
  "/refactoring": { section: "CodeAtlas", title: "Refactoring & Technical Debt" },
  "/architecture": { section: "CodeAtlas", title: "Architecture Graph" },
  "/city-map": { section: "CodeAtlas", title: "Architecture Graph" },
  "/change-impact": { section: "CodeAtlas", title: "Change Impact Analysis" },
  "/impact": { section: "CodeAtlas", title: "Change Impact Analysis" },
  "/code-review": { section: "CodeAtlas", title: "Automated Code Review" },
  "/activity": { section: "CodeAtlas", title: "Recent Activity" },
  "/settings": { section: "CodeAtlas", title: "Settings" },
  "/onboarding": { section: "CodeAtlas", title: "Onboarding Guided Tour" },
};

export default function AppHeader({ onMenuClick }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user, logout } = useAuth();
  const [isDemo, setIsDemo] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const isRealUser = Boolean(user && user.provider !== "demo" && user.id !== "demo-user");
  const showDemoBanner = isDemo && !isRealUser && !bannerDismissed;

  useEffect(() => {
    setIsDemo(isDemoMode());
    try {
      if (sessionStorage.getItem("codeatlas_demo_banner_dismissed") === "true") {
        setBannerDismissed(true);
      }
    } catch {}
  }, []);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Load real notifications from backend
  const loadNotifications = async () => {
    try {
      const data = await workspaceService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Keyboard shortcut: "/" or "Ctrl+K" / "Cmd+K" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === "Escape") {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMarkAllRead = async () => {
    await workspaceService.markNotificationRead(undefined, true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const breadcrumb = ROUTE_BREADCRUMBS[pathname] || {
    section: "CodeAtlas",
    title: pathname.replace(/^\//, "").replace(/-/g, " "),
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-page)]/85 px-4 sm:px-6 lg:px-10 backdrop-blur-md transition-colors duration-200">
        {/* Left: Mobile Menu Trigger + Breadcrumb */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open mobile navigation menu"
              className="lg:hidden p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Mobile Logo if sidebar is hidden */}
          <div className="lg:hidden mr-1">
            <Link
              href="/"
              aria-label="CodeAtlas home"
              className="flex items-center cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] group"
            >
              <Logo size="sm" showText={false} />
            </Link>
          </div>

          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="text-[var(--text-secondary)] font-medium hidden sm:inline">
              {breadcrumb.section}
            </span>
            <span className="text-[var(--text-secondary)]/50 hidden sm:inline">/</span>
            <span className="text-[var(--text-primary)] font-bold capitalize">
              {breadcrumb.title}
            </span>
          </nav>

          {showDemoBanner && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-medium animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Demo mode — sample data, no backend</span>
              <button
                type="button"
                onClick={() => {
                  setBannerDismissed(true);
                  try { sessionStorage.setItem("codeatlas_demo_banner_dismissed", "true"); } catch {}
                }}
                className="ml-1 hover:opacity-70 p-0.5"
                aria-label="Dismiss demo banner"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Middle & Right: Search, Notifications, Theme Toggle, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Global Search Button / Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search repositories, files, symbols"
            className={`relative flex items-center justify-between w-44 sm:w-72 lg:w-80 pl-3.5 pr-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all duration-200 text-left ${
              isDark
                ? "bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--text-primary)]"
                : "bg-white border-[#E5E5E0] text-[#5A5C5E] hover:border-[#6C4DFF] shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
              <span className="truncate">Search codebase...</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-[var(--text-secondary)] bg-[var(--border-color)]/60 px-1.5 py-0.5 rounded border border-[var(--border-color)]">
              <span>Ctrl K</span>
            </div>
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) loadNotifications();
              }}
              aria-label="Notifications"
              title="Notifications"
              className="relative flex items-center justify-center h-10 w-10 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)] text-[9px] font-mono font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <div
                  className={`absolute right-0 mt-2 w-80 sm:w-88 z-50 rounded-2xl border p-3 shadow-2xl animate-in fade-in slide-in-from-top-1 ${
                    isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                    <span className="text-xs font-bold text-[var(--text-primary)]">Notifications</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-mono font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Mark read
                        </button>
                      )}
                      <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                        {unreadCount} unread
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.href || "/dashboard"}
                          onClick={() => {
                            setShowNotifications(false);
                            workspaceService.markNotificationRead(n.id);
                          }}
                          className={`block p-2.5 rounded-xl border text-xs transition-colors ${
                            !n.read
                              ? isDark
                                ? "bg-[#111725] border-[#29D3C2]/40"
                                : "bg-[#FAF9FF] border-[#6C4DFF]/30"
                              : isDark
                              ? "bg-[#0D1117] border-[#30363D] opacity-75"
                              : "bg-white border-[#E8E5F4] opacity-75"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--text-primary)]">{n.title}</span>
                            {!n.read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                            {n.description}
                          </p>
                        </Link>
                      ))
                    ) : (
                      <p className="py-6 text-center text-xs text-[var(--text-secondary)]">
                        No notifications yet.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User Profile Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="Open developer profile menu"
            aria-expanded={showProfileMenu}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#7C5CFC]/15 text-[#7C5CFC] font-bold text-xs shadow-sm hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] overflow-hidden"
          >
            {user?.avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.avatar}
                alt={user.name || "User avatar"}
                className="h-full w-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>
                {user?.name
                  ? user.name
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase()
                  : "DV"}
              </span>
            )}
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div
                className={`absolute right-0 mt-2 w-60 z-50 rounded-2xl border p-2.5 shadow-2xl animate-in fade-in slide-in-from-top-1 ${
                  isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
                }`}
              >
                <div className="px-3 py-2 border-b border-[var(--border-color)]">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {user?.name || "Developer"}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] truncate">
                    {user?.username ? `@${user.username}` : user?.email || "Signed in"}
                  </p>
                  <span className="mt-1.5 inline-block text-[10px] font-mono font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded capitalize">
                    {user?.provider || "authenticated"}
                  </span>
                </div>

                <div className="space-y-0.5 pt-1.5">
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
                  >
                    <SettingsIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    Profile Settings
                  </Link>
                  <Link
                    href="/repositories"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
                  >
                    <FolderGit2 className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    My Repositories
                  </Link>
                  <div className="my-1 border-t border-[var(--border-color)]" />
                  <button
                    type="button"
                    onClick={async () => {
                      setShowProfileMenu(false);
                      try {
                        await logout();
                      } finally {
                        router.replace("/login");
                      }
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>

      {/* Global Command Palette / Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
