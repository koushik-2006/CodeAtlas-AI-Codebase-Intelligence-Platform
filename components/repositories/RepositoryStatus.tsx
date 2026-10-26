"use client";

import { useTheme } from "@/hooks/useTheme";
import { IndexingStatus } from "@/types/repository";

interface RepositoryStatusProps {
  status: IndexingStatus;
  progress?: number;
}

export function RepositoryStatus({ status, progress = 100 }: RepositoryStatusProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (status === "ready") {
    return (
      <span
        className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
          isDark
            ? "bg-[#2FD6A0]/10 text-[#2FD6A0]"
            : "bg-[#D7F7EA] text-[#1BA97B]"
        }`}
      >
        Indexed 100%
      </span>
    );
  }

  if (status === "indexing") {
    return (
      <span
        className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
          isDark
            ? "bg-[#F3C969]/15 text-[#F3C969]"
            : "bg-[#FFF0BF] text-[#B38300]"
        }`}
      >
        Indexing {progress}%
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span
        className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
          isDark
            ? "bg-blue-500/15 text-blue-400"
            : "bg-blue-50 text-blue-600"
        }`}
      >
        Queued
      </span>
    );
  }

  return (
    <span
      className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
        isDark
          ? "bg-red-500/15 text-red-400"
          : "bg-red-50 text-red-600"
      }`}
    >
      Analysis Failed
    </span>
  );
}
