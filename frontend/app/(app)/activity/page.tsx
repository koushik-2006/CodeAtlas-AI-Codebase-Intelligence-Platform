"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/hooks/useTheme";
import {
  ActivityEvent,
  ActivityModule,
  ActivityAction,
  ActivityStatus,
  ActivityFilterState,
} from "@/types/activity";
import { getAuditTrail, subscribe, getStore, DEMO_USER } from "@/lib/demo/store";
import { Toast } from "@/components/ui/Toast";
import Link from "next/link";
import {
  History,
  FolderGit2,
  GitBranch,
  Boxes,
  Bot,
  ScanSearch,
  Sparkles,
  Bug,
  Wrench,
  Network,
  GitCompare,
  GitPullRequest,
  Sliders,
  Shield,
  Layers,
  Search,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  ArrowUp,
  FileCode,
  Calendar,
  Filter,
  Eye,
  Activity,
} from "lucide-react";

const ALL_MODULES: { id: ActivityModule; label: string; icon: any }[] = [
  { id: "workspaces", label: "Workspaces", icon: Layers },
  { id: "repositories", label: "Repositories", icon: FolderGit2 },
  { id: "indexing", label: "Indexing", icon: GitBranch },
  { id: "multi-repo", label: "Multi-Repo", icon: Boxes },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "explorer", label: "Explorer", icon: ScanSearch },
  { id: "assistant", label: "Assistant", icon: Sparkles },
  { id: "debugger", label: "Debugger", icon: Bug },
  { id: "refactoring", label: "Refactoring", icon: Wrench },
  { id: "architecture", label: "Architecture", icon: Network },
  { id: "change-impact", label: "Change Impact", icon: GitCompare },
  { id: "code-review", label: "Code Review", icon: GitPullRequest },
  { id: "settings", label: "Settings", icon: Sliders },
  { id: "system-health", label: "System Health & Ops", icon: Activity },
  { id: "auth", label: "Auth", icon: Shield },
];

function formatRelativeTime(dateString: string): string {
  try {
    const deltaMs = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(deltaMs / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / (1000 * 60));
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

function getDayGroupingLabel(dateString: string): string {
  try {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const checkDate = new Date(eventDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === today.getTime()) {
      return "Today";
    }
    if (checkDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    return eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Earlier";
  }
}

function getModuleIcon(module: ActivityModule) {
  switch (module) {
    case "workspaces":
      return Layers;
    case "repositories":
      return FolderGit2;
    case "indexing":
      return GitBranch;
    case "multi-repo":
      return Boxes;
    case "agents":
      return Bot;
    case "explorer":
      return ScanSearch;
    case "assistant":
      return Sparkles;
    case "debugger":
      return Bug;
    case "refactoring":
      return Wrench;
    case "architecture":
      return Network;
    case "change-impact":
      return GitCompare;
    case "code-review":
      return GitPullRequest;
    case "settings":
      return Sliders;
    case "system-health":
      return Activity;
    case "auth":
      return Shield;
    default:
      return History;
  }
}

function getStatusBadge(status: ActivityStatus) {
  switch (status) {
    case "success":
      return {
        label: "Success",
        icon: CheckCircle2,
        className:
          "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
      };
    case "warning":
      return {
        label: "Warning",
        icon: AlertTriangle,
        className:
          "bg-amber-500/10 text-amber-500 border border-amber-500/20",
      };
    case "failed":
      return {
        label: "Failed",
        icon: AlertCircle,
        className: "bg-red-500/10 text-red-500 border border-red-500/20",
      };
    case "info":
    default:
      return {
        label: "Info",
        icon: Info,
        className:
          "bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20",
      };
  }
}

function ActivityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // URL Query initialization
  const urlModule = searchParams.get("module") as ActivityModule | null;
  const urlStatus = searchParams.get("status") || "all";
  const urlAction = searchParams.get("action") || "all";
  const urlActor = searchParams.get("actor") || "all";
  const urlWorkspace = searchParams.get("workspace") || "all";
  const urlRepo = searchParams.get("repository") || "all";
  const urlSearch = searchParams.get("search") || "";
  const urlRange =
    (searchParams.get("range") as ActivityFilterState["dateRange"]) || "all";
  const urlEventId = searchParams.get("event") || null;

  // Filter State
  const [filterState, setFilterState] = useState<ActivityFilterState>({
    search: urlSearch,
    modules: urlModule ? [urlModule] : [],
    action: urlAction,
    status: urlStatus,
    actor: urlActor,
    workspace: urlWorkspace,
    repository: urlRepo,
    dateRange: urlRange,
  });

  const [allEvents, setAllEvents] = useState<ActivityEvent[]>([]);
  const [inspectEvent, setInspectEvent] = useState<ActivityEvent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    message?: string;
    type?: "success" | "error" | "info";
  } | null>(null);

  // Scroll & New Events tracking
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [unreadNewCount, setUnreadNewCount] = useState(0);
  const initialLoadRef = useRef(true);
  const prevCountRef = useRef(0);

  // Sync state to URL without reloading
  const updateUrlParams = useCallback(
    (newState: ActivityFilterState, eventId?: string | null) => {
      const params = new URLSearchParams();
      if (newState.search) params.set("search", newState.search);
      if (newState.modules.length === 1)
        params.set("module", newState.modules[0]);
      if (newState.action !== "all") params.set("action", newState.action);
      if (newState.status !== "all") params.set("status", newState.status);
      if (newState.actor !== "all") params.set("actor", newState.actor);
      if (newState.workspace !== "all")
        params.set("workspace", newState.workspace);
      if (newState.repository !== "all")
        params.set("repository", newState.repository);
      if (newState.dateRange !== "all")
        params.set("range", newState.dateRange);
      if (newState.customDate) params.set("date", newState.customDate);
      if (eventId) params.set("event", eventId);

      const qs = params.toString();
      const currentPath =
        typeof window !== "undefined"
          ? window.location.pathname
          : "/activity";
      const targetUrl = `${currentPath}${qs ? `?${qs}` : ""}`;
      window.history.replaceState(null, "", targetUrl);
    },
    []
  );

  // Load audit trail from shared store
  const refreshAuditTrail = useCallback(() => {
    const list = getAuditTrail();
    setAllEvents(list);

    if (!initialLoadRef.current && list.length > prevCountRef.current) {
      if (isScrolledDown) {
        setUnreadNewCount(
          (prev) => prev + (list.length - prevCountRef.current)
        );
      }
    }
    prevCountRef.current = list.length;
    initialLoadRef.current = false;
  }, [isScrolledDown]);

  // Initial load and subscription to store
  useEffect(() => {
    refreshAuditTrail();
    const unsubscribe = subscribe(() => {
      refreshAuditTrail();
    });
    return () => unsubscribe();
  }, [refreshAuditTrail]);

  // Handle URL deep link for opening an event drawer
  useEffect(() => {
    if (urlEventId && allEvents.length > 0) {
      const found = allEvents.find((e) => e.id === urlEventId);
      if (found) {
        setInspectEvent(found);
      }
    }
  }, [urlEventId, allEvents]);

  // Track window scroll for floating pill
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 300) {
        setIsScrolledDown(true);
      } else {
        setIsScrolledDown(false);
        setUnreadNewCount(0);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return getAuditTrail(filterState);
  }, [filterState, allEvents]);

  // Distinct actors and workspaces/repos for filter dropdowns
  const uniqueActors = useMemo(() => {
    const map = new Map<string, string>();
    allEvents.forEach((e) => {
      if (e.actor?.name) map.set(e.actor.id, e.actor.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allEvents]);

  const uniqueRepos = useMemo(() => {
    const set = new Set<string>();
    allEvents.forEach((e) => {
      if (e.repositoryId) set.add(e.repositoryId);
    });
    return Array.from(set);
  }, [allEvents]);

  // Compute Counts
  const counts = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    let todayCount = 0;
    let weekCount = 0;

    allEvents.forEach((e) => {
      const t = new Date(e.time).getTime();
      if (t >= todayStart.getTime()) todayCount++;
      if (t >= oneWeekAgo) weekCount++;
    });

    return {
      today: todayCount,
      thisWeek: weekCount,
      total: allEvents.length,
    };
  }, [allEvents]);

  // Chart: Daily Event Distribution (last 10 days)
  const chartDays = useMemo(() => {
    const days: { dateStr: string; label: string; count: number }[] = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label =
        i === 0
          ? "Today"
          : i === 1
          ? "Yest"
          : d.toLocaleDateString("en-US", { weekday: "short" });
      const dayCount = allEvents.filter((e) =>
        e.time.startsWith(dateStr)
      ).length;
      days.push({ dateStr, label, count: dayCount });
    }
    return days;
  }, [allEvents]);

  const maxChartCount = useMemo(() => {
    return Math.max(1, ...chartDays.map((d) => d.count));
  }, [chartDays]);

  // Group filtered events by Day
  const groupedEvents = useMemo(() => {
    const groups: { label: string; events: ActivityEvent[] }[] = [];
    const map = new Map<string, ActivityEvent[]>();

    filteredEvents.forEach((event) => {
      const label = getDayGroupingLabel(event.time);
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label)!.push(event);
    });

    map.forEach((events, label) => {
      groups.push({ label, events });
    });

    return groups;
  }, [filteredEvents]);

  // Actions
  const handleToggleModule = (modId: ActivityModule) => {
    setFilterState((prev) => {
      const isSelected = prev.modules.includes(modId);
      const newModules = isSelected
        ? prev.modules.filter((m) => m !== modId)
        : [...prev.modules, modId];
      const next = { ...prev, modules: newModules };
      updateUrlParams(next, inspectEvent?.id);
      return next;
    });
  };

  const handleClearModules = () => {
    setFilterState((prev) => {
      const next = { ...prev, modules: [] };
      updateUrlParams(next, inspectEvent?.id);
      return next;
    });
  };

  const handleResetFilters = () => {
    const clean: ActivityFilterState = {
      search: "",
      modules: [],
      action: "all",
      status: "all",
      actor: "all",
      workspace: "all",
      repository: "all",
      dateRange: "all",
    };
    setFilterState(clean);
    updateUrlParams(clean, inspectEvent?.id);
  };

  const handleSelectDay = (dateStr: string) => {
    setFilterState((prev) => {
      if (prev.dateRange === "custom" && prev.customDate === dateStr) {
        // Toggle off
        const next: ActivityFilterState = {
          ...prev,
          dateRange: "all",
          customDate: undefined,
        };
        updateUrlParams(next, inspectEvent?.id);
        return next;
      }
      const next: ActivityFilterState = {
        ...prev,
        dateRange: "custom",
        customDate: dateStr,
      };
      updateUrlParams(next, inspectEvent?.id);
      return next;
    });
  };

  const handleOpenDrawer = (event: ActivityEvent) => {
    setInspectEvent(event);
    updateUrlParams(filterState, event.id);
  };

  const handleCloseDrawer = () => {
    setInspectEvent(null);
    updateUrlParams(filterState, null);
  };

  const handleCopyLink = (event: ActivityEvent) => {
    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname
        : "/activity";
    const fullUrl = `${window.location.origin}${currentPath}?event=${event.id}`;
    navigator.clipboard.writeText(fullUrl);
    setToastMessage({
      title: "Link Copied",
      message: `Audit event #${event.id} link copied to clipboard.`,
      type: "success",
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    setShowExportMenu(false);
    const headers = [
      "ID",
      "Time (ISO)",
      "Module",
      "Action",
      "Status",
      "Actor Name",
      "Actor Email",
      "Target Type",
      "Target Name",
      "Title",
      "Short Description",
      "Link",
    ];

    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredEvents.map((e) => [
      escapeCsv(e.id),
      escapeCsv(e.time),
      escapeCsv(e.module),
      escapeCsv(e.action),
      escapeCsv(e.status),
      escapeCsv(e.actor?.name),
      escapeCsv(e.actor?.email),
      escapeCsv(typeof e.target === "object" ? e.target.type : "resource"),
      escapeCsv(typeof e.target === "object" ? e.target.name : e.target),
      escapeCsv(e.title),
      escapeCsv(e.shortDescription),
      escapeCsv(e.link || e.href),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `codeatlas-audit-trail-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setToastMessage({
      title: "Export Complete",
      message: `Exported ${filteredEvents.length} events to CSV.`,
      type: "success",
    });
  };

  // Export JSON
  const handleExportJSON = () => {
    setShowExportMenu(false);
    const jsonStr = JSON.stringify(filteredEvents, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `codeatlas-audit-trail-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setToastMessage({
      title: "Export Complete",
      message: `Exported ${filteredEvents.length} events to JSON.`,
      type: "success",
    });
  };

  const hasActiveFilters =
    filterState.search !== "" ||
    filterState.modules.length > 0 ||
    filterState.action !== "all" ||
    filterState.status !== "all" ||
    filterState.actor !== "all" ||
    filterState.workspace !== "all" ||
    filterState.repository !== "all" ||
    filterState.dateRange !== "all";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          type={toastMessage.type || "info"}
          title={toastMessage.title}
          message={toastMessage.message}
          duration={3500}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Floating Pill: New Events Arrived */}
      {unreadNewCount > 0 && isScrolledDown && (
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setUnreadNewCount(0);
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-[#7C5CFC] text-white text-xs font-bold shadow-xl hover:bg-[#6848EA] transition-all animate-bounce"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>{unreadNewCount} new event{unreadNewCount > 1 ? "s" : ""} recorded</span>
        </button>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[var(--border-color)]">
        <div>
          <PageHeader
            title="Activity & Audit Trail"
            sub="Complete immutable audit trail across code repositories, AI agents, code reviews, and workspace access."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Live Sync Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Audit Sync</span>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] hover:border-[#7C5CFC] transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#7C5CFC]" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div
                className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-xl z-30 p-1.5 space-y-1 ${
                  isDark
                    ? "bg-[#111726] border-[#242B39]"
                    : "bg-white border-[#E8E5F4]"
                }`}
              >
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left hover:bg-[#7C5CFC]/10 hover:text-[#7C5CFC] transition-colors"
                >
                  <span>Export CSV</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">.csv</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left hover:bg-[#7C5CFC]/10 hover:text-[#7C5CFC] transition-colors"
                >
                  <span>Export JSON</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">.json</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Counts & Small Daily Chart Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metric Badges */}
        <div className="lg:col-span-1 grid grid-cols-3 gap-3">
          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isDark ? "bg-[#111726]/60 border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-2xs"
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Today
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[var(--text-primary)]">
                {counts.today}
              </span>
              <span className="text-[10px] text-emerald-500 font-bold font-mono">events</span>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isDark ? "bg-[#111726]/60 border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-2xs"
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              This Week
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#7C5CFC]">
                {counts.thisWeek}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] font-bold font-mono">logged</span>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between ${
              isDark ? "bg-[#111726]/60 border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-2xs"
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Total Trail
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[var(--text-primary)]">
                {counts.total}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] font-bold font-mono">total</span>
            </div>
          </div>
        </div>

        {/* Interactive Mini Daily Event Chart */}
        <div
          className={`lg:col-span-2 p-4 rounded-2xl border flex flex-col justify-between ${
            isDark ? "bg-[#111726]/60 border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#7C5CFC]" />
              Event Volume by Day (Click a bar to filter)
            </span>
            {filterState.dateRange === "custom" && filterState.customDate && (
              <button
                onClick={() => handleSelectDay(filterState.customDate!)}
                className="text-[11px] font-bold text-[#7C5CFC] hover:underline"
              >
                Clear Day Filter
              </button>
            )}
          </div>

          {/* SVG Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-16 pt-2">
            {chartDays.map((d) => {
              const isSelected =
                filterState.dateRange === "custom" &&
                filterState.customDate === d.dateStr;
              const barHeightPct = Math.max(12, Math.round((d.count / maxChartCount) * 100));

              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => handleSelectDay(d.dateStr)}
                  title={`${d.dateStr}: ${d.count} events`}
                  className="flex-1 flex flex-col items-center gap-1 group focus:outline-none"
                >
                  <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    {d.count}
                  </span>
                  <div className="w-full h-10 flex items-end justify-center">
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all duration-200 ${
                        isSelected
                          ? "bg-[#7C5CFC] ring-2 ring-[#7C5CFC]/40"
                          : d.count > 0
                          ? "bg-[#7C5CFC]/40 group-hover:bg-[#7C5CFC]/80"
                          : "bg-[var(--border-color)]/50"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected
                        ? "text-[#7C5CFC] font-bold"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {d.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div
        className={`p-4 rounded-2xl border space-y-4 ${
          isDark ? "bg-[#111726]/40 border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-2xs"
        }`}
      >
        {/* Row 1: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search audit trail, actors, actions..."
              value={filterState.search}
              onChange={(e) => {
                const s = e.target.value;
                setFilterState((prev) => {
                  const next = { ...prev, search: s };
                  updateUrlParams(next, inspectEvent?.id);
                  return next;
                });
              }}
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border outline-none transition-colors ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#7C5CFC]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#7C5CFC]"
              }`}
            />
            {filterState.search && (
              <button
                onClick={() => {
                  setFilterState((prev) => {
                    const next = { ...prev, search: "" };
                    updateUrlParams(next, inspectEvent?.id);
                    return next;
                  });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={filterState.action}
              onChange={(e) => {
                const a = e.target.value;
                setFilterState((prev) => {
                  const next = { ...prev, action: a };
                  updateUrlParams(next, inspectEvent?.id);
                  return next;
                });
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none capitalize ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA]"
                  : "bg-white border-[#E8E5F4] text-[#19143D]"
              }`}
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="merge">Merge</option>
              <option value="approve">Approve</option>
              <option value="apply">Apply</option>
              <option value="index">Index</option>
              <option value="analyze">Analyze</option>
              <option value="scan">Scan</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="connect">Connect</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterState.status}
              onChange={(e) => {
                const s = e.target.value;
                setFilterState((prev) => {
                  const next = { ...prev, status: s };
                  updateUrlParams(next, inspectEvent?.id);
                  return next;
                });
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none capitalize ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA]"
                  : "bg-white border-[#E8E5F4] text-[#19143D]"
              }`}
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="failed">Failed</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Actor Filter */}
          <div>
            <select
              value={filterState.actor}
              onChange={(e) => {
                const a = e.target.value;
                setFilterState((prev) => {
                  const next = { ...prev, actor: a };
                  updateUrlParams(next, inspectEvent?.id);
                  return next;
                });
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA]"
                  : "bg-white border-[#E8E5F4] text-[#19143D]"
              }`}
            >
              <option value="all">All Actors</option>
              {uniqueActors.map((act) => (
                <option key={act.id} value={act.name}>
                  {act.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div>
            <select
              value={filterState.dateRange}
              onChange={(e) => {
                const r = e.target.value as ActivityFilterState["dateRange"];
                setFilterState((prev) => {
                  const next = { ...prev, dateRange: r };
                  updateUrlParams(next, inspectEvent?.id);
                  return next;
                });
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none capitalize ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA]"
                  : "bg-white border-[#E8E5F4] text-[#19143D]"
              }`}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              {filterState.customDate && (
                <option value="custom">Day: {filterState.customDate}</option>
              )}
            </select>
          </div>
        </div>

        {/* Row 2: Module Badges (Multi-Select) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Filter by Module ({filterState.modules.length > 0 ? `${filterState.modules.length} selected` : "All"})
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-[#7C5CFC] hover:underline"
              >
                Reset All Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleClearModules}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                filterState.modules.length === 0
                  ? "bg-[#7C5CFC] text-white border-[#7C5CFC]"
                  : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]/20"
              }`}
            >
              All Modules
            </button>

            {ALL_MODULES.map((m) => {
              const Icon = m.icon;
              const isSelected = filterState.modules.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => handleToggleModule(m.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? "bg-[#7C5CFC] text-white border-[#7C5CFC]"
                      : isDark
                      ? "bg-[#111726]/40 border-[#242B39] text-[var(--text-secondary)] hover:border-[#7C5CFC]/40"
                      : "bg-[#F9FAFB] border-[#E8E5F4] text-[var(--text-secondary)] hover:border-[#7C5CFC]/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Timeline List */}
      {groupedEvents.length === 0 ? (
        <div className="py-20 text-center app-card p-8 border border-[var(--border-color)] rounded-2xl">
          <History className="w-10 h-10 mx-auto text-[var(--text-secondary)]/40 mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            No matching audit events found
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Try adjusting your search terms, removing module filters, or extending the date range.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-[#7C5CFC] text-white text-xs font-bold hover:bg-[#6848EA] transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedEvents.map((group) => (
            <div key={group.label} className="space-y-3">
              {/* Day Section Header */}
              <div className="sticky top-14 z-10 flex items-center gap-2 py-2 backdrop-blur-md bg-[var(--bg-main)]/80">
                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20">
                  {group.label}
                </span>
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  ({group.events.length} event{group.events.length > 1 ? "s" : ""})
                </span>
                <div className="flex-1 border-t border-[var(--border-color)]" />
              </div>

              {/* Event Cards */}
              <div className="space-y-3">
                {group.events.map((act) => {
                  const ModuleIcon = getModuleIcon(act.module);
                  const statusMeta = getStatusBadge(act.status);
                  const StatusIcon = statusMeta.icon;
                  const targetName =
                    typeof act.target === "object"
                      ? act.target.name
                      : act.target || act.module;
                  const targetType =
                    typeof act.target === "object"
                      ? act.target.type
                      : act.module;

                  return (
                    <div
                      key={act.id}
                      className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-150 hover:border-[#7C5CFC]/50 hover:shadow-md ${
                        isDark
                          ? "bg-[#111726]/60 border-[#242B39]"
                          : "bg-white border-[#E8E5F4]"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Left: Icon & Core Details */}
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          {/* Module Icon Badge */}
                          <div
                            className={`p-2.5 rounded-2xl shrink-0 mt-0.5 border ${
                              isDark
                                ? "bg-[#161D2E] text-[#7C5CFC] border-[#2A3449]"
                                : "bg-[#F4F1FF] text-[#7C5CFC] border-[#E6E0FF]"
                            }`}
                          >
                            <ModuleIcon className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1.5">
                            {/* Title & Status Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              <h3
                                onClick={() => handleOpenDrawer(act)}
                                className="text-sm sm:text-base font-bold text-[var(--text-primary)] hover:text-[#7C5CFC] cursor-pointer transition-colors"
                              >
                                {act.title}
                              </h3>

                              {/* Status Badge */}
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full capitalize ${statusMeta.className}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                <span>{act.status}</span>
                              </span>

                              {/* Module & Action Badges */}
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[var(--border-color)]/30 text-[var(--text-secondary)] uppercase">
                                {act.module} • {act.action}
                              </span>
                            </div>

                            {/* Short Description */}
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                              {act.shortDescription || act.description}
                            </p>

                            {/* Metadata Row: Actor + Target + Timestamp */}
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[var(--text-secondary)] font-medium">
                              {/* Actor */}
                              <div className="flex items-center gap-1.5">
                                {act.actor?.avatar ? (
                                  <img
                                    src={act.actor.avatar}
                                    alt={act.actor.name}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-[#7C5CFC]/20 text-[#7C5CFC] text-[9px] font-bold flex items-center justify-center">
                                    {(act.actor?.name || "U")[0]}
                                  </div>
                                )}
                                <span className="font-semibold text-[var(--text-primary)]">
                                  {act.actor?.name || "Demo User"}
                                </span>
                              </div>

                              <span>•</span>

                              {/* Target Chip */}
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--border-color)]/40 text-[var(--text-primary)]">
                                <span className="text-[var(--text-secondary)]">{targetType}:</span>
                                <span className="font-bold truncate max-w-[180px]">{targetName}</span>
                              </span>

                              <span>•</span>

                              {/* Time */}
                              <span
                                title={act.time}
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] cursor-help"
                              >
                                <Clock className="w-3 h-3" />
                                <span>{formatRelativeTime(act.time)}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions (Inspect & Open Link) */}
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(act)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                              isDark
                                ? "border-[#242B39] text-[#7C5CFC] hover:bg-[#161D2E]"
                                : "border-[#E8E5F4] text-[#7C5CFC] hover:bg-[#FAF9FF]"
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          {act.link && act.link !== "#" && (
                            <Link
                              href={act.link}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#7C5CFC] text-white hover:bg-[#6848EA] transition-colors shadow-2xs"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-Over Detail Drawer */}
      {inspectEvent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={handleCloseDrawer}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Panel */}
          <div
            className={`relative w-full max-w-xl h-full shadow-2xl flex flex-col z-10 overflow-hidden border-l ${
              isDark
                ? "bg-[#0D121E] border-[#242B39]"
                : "bg-white border-[#E8E5F4]"
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20">
                  {(() => {
                    const Icon = getModuleIcon(inspectEvent.module);
                    return <Icon className="w-4 h-4" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Audit Event Details
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                      {inspectEvent.id}
                    </span>
                    <button
                      onClick={() => handleCopyId(inspectEvent.id)}
                      className="text-[var(--text-secondary)] hover:text-[#7C5CFC] transition-colors"
                      title="Copy Event ID"
                    >
                      {copiedId === inspectEvent.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloseDrawer}
                className="p-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--border-color)]/20 text-[var(--text-secondary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Event Title & Status */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {inspectEvent.title}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      getStatusBadge(inspectEvent.status).className
                    }`}
                  >
                    {inspectEvent.status}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {inspectEvent.description}
                </p>
              </div>

              {/* Metadata Grid */}
              <div
                className={`p-4 rounded-2xl border grid grid-cols-2 gap-4 ${
                  isDark
                    ? "bg-[#111726]/40 border-[#242B39]"
                    : "bg-[#F9FAFB] border-[#E8E5F4]"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Timestamp
                  </span>
                  <p className="text-xs font-mono font-medium text-[var(--text-primary)] mt-1">
                    {new Date(inspectEvent.time).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate">
                    {inspectEvent.time}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Module / Action
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-bold text-[#7C5CFC] uppercase">
                      {inspectEvent.module}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">•</span>
                    <span className="text-xs font-semibold capitalize text-[var(--text-primary)]">
                      {inspectEvent.action}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Actor Identity
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {inspectEvent.actor?.avatar ? (
                      <img
                        src={inspectEvent.actor.avatar}
                        alt={inspectEvent.actor.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#7C5CFC]/20 text-[#7C5CFC] text-[10px] font-bold flex items-center justify-center">
                        {(inspectEvent.actor?.name || "U")[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">
                        {inspectEvent.actor?.name || "Demo User"}
                      </p>
                      {inspectEvent.actor?.role && (
                        <p className="text-[10px] text-[var(--text-secondary)]">
                          {inspectEvent.actor.role}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Target Resource
                  </span>
                  <div className="mt-1">
                    <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
                      {typeof inspectEvent.target === "object"
                        ? inspectEvent.target.name
                        : inspectEvent.target}
                    </span>
                    <span className="block text-[10px] text-[var(--text-secondary)] capitalize">
                      Type:{" "}
                      {typeof inspectEvent.target === "object"
                        ? inspectEvent.target.type
                        : inspectEvent.module}
                    </span>
                  </div>
                </div>
              </div>

              {/* Before / After Key-Value Comparison Table */}
              {(inspectEvent.details?.before || inspectEvent.details?.after) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    State Changes (Before / After)
                  </h4>
                  <div
                    className={`rounded-2xl border overflow-hidden ${
                      isDark
                        ? "border-[#242B39] bg-[#111726]/40"
                        : "border-[#E8E5F4] bg-white"
                    }`}
                  >
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-color)] bg-[var(--border-color)]/20">
                          <th className="px-3.5 py-2 text-left font-bold text-[var(--text-secondary)]">
                            Field
                          </th>
                          <th className="px-3.5 py-2 text-left font-bold text-red-500">
                            Before
                          </th>
                          <th className="px-3.5 py-2 text-left font-bold text-emerald-500">
                            After
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)] font-mono">
                        {Object.keys({
                          ...(inspectEvent.details.before || {}),
                          ...(inspectEvent.details.after || {}),
                        }).map((key) => {
                          const beforeVal = inspectEvent.details?.before?.[key];
                          const afterVal = inspectEvent.details?.after?.[key];
                          return (
                            <tr key={key}>
                              <td className="px-3.5 py-2 font-bold text-[var(--text-primary)]">
                                {key}
                              </td>
                              <td className="px-3.5 py-2 text-red-400 bg-red-500/5">
                                {beforeVal !== undefined
                                  ? typeof beforeVal === "object"
                                    ? JSON.stringify(beforeVal)
                                    : String(beforeVal)
                                  : "—"}
                              </td>
                              <td className="px-3.5 py-2 text-emerald-400 bg-emerald-500/5">
                                {afterVal !== undefined
                                  ? typeof afterVal === "object"
                                    ? JSON.stringify(afterVal)
                                    : String(afterVal)
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mini Diff Viewer */}
              {inspectEvent.details?.diff && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-[#7C5CFC]" />
                      Applied Patch Diff
                    </h4>
                  </div>

                  <div
                    className={`rounded-2xl border p-3 font-mono text-xs overflow-x-auto max-h-72 ${
                      isDark
                        ? "bg-[#0A0F19] border-[#242B39]"
                        : "bg-[#F9FAFB] border-[#E8E5F4]"
                    }`}
                  >
                    {inspectEvent.details.diff.split("\n").map((line, idx) => {
                      const isAddition = line.startsWith("+");
                      const isDeletion = line.startsWith("-");
                      const isHeader = line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++");

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 py-0.5 px-2 rounded ${
                            isAddition
                              ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                              : isDeletion
                              ? "bg-red-500/10 text-red-400 font-semibold"
                              : isHeader
                              ? "text-[#7C5CFC] font-bold"
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          <span className="w-6 text-[10px] text-right select-none opacity-40 shrink-0">
                            {idx + 1}
                          </span>
                          <span className="whitespace-pre flex-1">{line}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between gap-3 bg-[var(--bg-surface)]">
              <button
                type="button"
                onClick={() => handleCopyLink(inspectEvent)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] hover:border-[#7C5CFC] transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-[#7C5CFC]" />
                <span>Copy Event Link</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Close
                </button>

                {inspectEvent.link && inspectEvent.link !== "#" && (
                  <Link
                    href={inspectEvent.link}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#7C5CFC] text-white hover:bg-[#6848EA] transition-colors shadow-2xs"
                  >
                    <span>Open Resource</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-xs text-[var(--text-secondary)]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#7C5CFC] mb-3" />
          <span>Loading Activity & Audit Trail...</span>
        </div>
      }
    >
      <ActivityContent />
    </Suspense>
  );
}
