"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { ReviewChangedFile } from "@/types/review";
import { FileCode, ChevronDown, ChevronRight, Plus, Minus } from "lucide-react";

interface DiffViewerProps {
  files: ReviewChangedFile[];
  selectedFile?: string;
  onSelectFile?: (filename: string) => void;
}

export function DiffViewer({ files, selectedFile, onSelectFile }: DiffViewerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    files.forEach((f) => {
      init[f.filename] = true;
    });
    return init;
  });

  const toggleExpand = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  return (
    <div className="space-y-4">
      {files.map((file) => {
        const isExpanded = expandedFiles[file.filename] !== false;
        const rawLines = (file.patch || "").split("\n");

        return (
          <div
            key={file.filename}
            className={`rounded-2xl border overflow-hidden transition-all shadow-xs ${
              isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
            }`}
          >
            {/* File Header */}
            <div
              onClick={() => toggleExpand(file.filename)}
              className={`p-3.5 flex items-center justify-between cursor-pointer border-b transition-colors ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] hover:bg-[#111725]"
                  : "bg-[var(--bg-page)]/60 border-[#E8E5F4] hover:bg-[#F2EFFE]"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                )}
                <FileCode className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                  {file.filename}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    file.status === "added"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : file.status === "deleted"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {file.status}
                </span>
              </div>

              {/* Additions / Deletions pills */}
              <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                <span className="text-emerald-500 font-bold flex items-center">
                  <Plus className="w-3 h-3" />
                  {file.additions}
                </span>
                <span className="text-red-500 font-bold flex items-center">
                  <Minus className="w-3 h-3" />
                  {file.deletions}
                </span>
              </div>
            </div>

            {/* Diff Patch Content */}
            {isExpanded && (
              <div className="overflow-x-auto text-xs font-mono leading-5">
                {rawLines.length > 0 && file.patch ? (
                  <div className="py-1">
                    {rawLines.map((line, idx) => {
                      const isAdd = line.startsWith("+");
                      const isDel = line.startsWith("-");
                      const isHunkHeader = line.startsWith("@@");

                      let lineClass = "";
                      let textClass = isDark ? "text-[#E6EDF3]" : "text-[#1E2022]";

                      if (isHunkHeader) {
                        lineClass = isDark ? "bg-[#1E293B]/40" : "bg-[#EDE9FE]/50";
                        textClass = "text-[var(--primary)] font-bold";
                      } else if (isAdd) {
                        lineClass = isDark ? "bg-emerald-950/30" : "bg-emerald-50";
                        textClass = isDark ? "text-emerald-300" : "text-emerald-800";
                      } else if (isDel) {
                        lineClass = isDark ? "bg-red-950/30" : "bg-red-50";
                        textClass = isDark ? "text-red-300" : "text-red-800";
                      }

                      return (
                        <div
                          key={idx}
                          className={`flex items-start px-3 py-0.5 ${lineClass}`}
                        >
                          <span className="w-6 text-[10px] text-[var(--text-secondary)] select-none shrink-0 font-mono">
                            {idx + 1}
                          </span>
                          <span className={`flex-1 whitespace-pre font-mono ${textClass}`}>
                            {line}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-xs font-mono text-[var(--text-secondary)] text-center">
                    (No patch content or binary file)
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
