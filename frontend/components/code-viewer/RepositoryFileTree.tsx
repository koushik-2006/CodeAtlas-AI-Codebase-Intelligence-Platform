"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  CheckCircle2,
} from "lucide-react";

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileItem[];
  language?: string;
  size?: string;
}

interface RepositoryFileTreeProps {
  files: FileItem[];
  selectedFilePath?: string;
  onSelectFile: (file: FileItem) => void;
  rootLabel?: string;
}

export function RepositoryFileTree({
  files,
  selectedFilePath,
  onSelectFile,
  rootLabel = "sample-project",
}: RepositoryFileTreeProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [filter, setFilter] = useState("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    "folder-src": true,
    "folder-components": true,
    "folder-services": true,
    "folder-utils": true,
    "folder-tests": true,
  });

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".md") || fileName.endsWith(".txt")) {
      return FileText;
    }
    return FileCode;
  };

  const matchesFilter = (item: FileItem): boolean => {
    if (!filter.trim()) return true;
    const term = filter.toLowerCase();
    if (item.name.toLowerCase().includes(term)) return true;
    if (item.children) {
      return item.children.some(matchesFilter);
    }
    return false;
  };

  const renderItem = (item: FileItem, depth = 0) => {
    const isFolder = item.type === "folder";
    const isOpen = openFolders[item.id] ?? true;
    const isSelected = selectedFilePath === item.path;

    if (!matchesFilter(item)) {
      return null;
    }

    const Icon = isFolder ? (isOpen ? FolderOpen : Folder) : getFileIcon(item.name);

    return (
      <div key={item.id} style={{ paddingLeft: `${depth * 14}px` }}>
        {isFolder ? (
          <div>
            <button
              type="button"
              onClick={() => toggleFolder(item.id)}
              className="w-full flex items-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              )}
              <Icon className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span className="truncate">{item.name}/</span>
            </button>
            {isOpen && item.children && (
              <div className="mt-0.5 space-y-0.5">
                {item.children.map((child) => renderItem(child, depth + 1))}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onSelectFile(item)}
            className={`w-full flex items-center justify-between py-1.5 px-2 rounded-xl text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
              isSelected
                ? "bg-[var(--primary)]/15 text-[var(--primary)] font-bold border border-[var(--primary)]/30"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/20"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isSelected ? "text-[var(--primary)]" : "opacity-75"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              {item.name.endsWith(".tsx") || item.name.endsWith(".ts") ? (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-500/10 text-blue-500 font-bold">TS</span>
              ) : item.name.endsWith(".jsx") || item.name.endsWith(".js") ? (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 font-bold">JS</span>
              ) : item.name.endsWith(".py") ? (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-500 font-bold">PY</span>
              ) : item.name.endsWith(".json") ? (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-yellow-500/10 text-yellow-500 font-bold">JSON</span>
              ) : item.name.endsWith(".sql") ? (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-500/10 text-purple-500 font-bold">SQL</span>
              ) : item.name.endsWith(".html") || item.name.endsWith(".htm") ? (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-orange-500/10 text-orange-500 font-bold">HTML</span>
              ) : item.name.endsWith(".yml") || item.name.endsWith(".yaml") ? (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-500/10 text-rose-500 font-bold">YAML</span>
              ) : null}
              {item.size && (
                <span className="text-[10px] font-mono opacity-50">
                  {item.size}
                </span>
              )}
            </div>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)]">
      {/* Root Project Label */}
      <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-page)]/40">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--text-primary)] truncate">
          <Folder className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span className="truncate">{rootLabel}/</span>
        </div>
        <span className="text-[9px] font-mono text-[var(--primary)] font-bold uppercase bg-[var(--primary)]/10 px-1.5 py-0.5 rounded">
          Active Repo
        </span>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-[var(--border-color)]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)] pointer-events-none" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search filenames..."
            aria-label="Search filenames"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:border-[var(--primary)] outline-none"
          />
        </div>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5" role="tree">
        {files.map((f) => renderItem(f, 0))}
      </div>
    </div>
  );
}
