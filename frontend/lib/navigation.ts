import {
  LayoutDashboard,
  Users,
  FolderGit2,
  ScanSearch,
  Sparkles,
  Network,
  GitCompare,
  GitPullRequest,
  History,
  Settings,
  Bug,
  Wrench,
  Layers,
  Bot,
  Activity,
} from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  altHref?: string;
  icon: any;
  badge?: string;
}

export const MAIN_NAVIGATION: NavigationItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Workspaces", href: "/workspaces", icon: Users },
  { name: "My Repositories", href: "/repositories", icon: FolderGit2 },
  { name: "Multi-Repository", href: "/multi-repo", icon: Layers, badge: "New" },
  { name: "Agent Workspace", href: "/agents", icon: Bot, badge: "Agentic" },
  { name: "Visual Code Explorer", href: "/visual-explorer", altHref: "/visual-code-explorer", icon: ScanSearch },
  { name: "AI Assistant", href: "/assistant", icon: Sparkles },
  { name: "AI Debugger", href: "/debug", icon: Bug, badge: "New" },
  { name: "Refactoring & Debt", href: "/refactoring", icon: Wrench, badge: "AI" },
  { name: "Architecture Graph", href: "/architecture", altHref: "/city-map", icon: Network },
  { name: "Change Impact", href: "/change-impact", altHref: "/impact", icon: GitCompare },
  { name: "Code Review", href: "/code-review", icon: GitPullRequest, badge: "AI" },
  { name: "Recent Activity", href: "/activity", icon: History },
  { name: "System Health & Ops", href: "/system-health", altHref: "/operations", icon: Activity, badge: "SRE" },
  { name: "Settings", href: "/settings", icon: Settings },
];

