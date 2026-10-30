"use client";

import { useTheme } from "@/hooks/useTheme";
import { ClipboardPaste, UploadCloud, Camera } from "lucide-react";

export type ExplorerInputMode = "Paste Code" | "Upload Screenshot" | "Camera Capture";

interface CodeInputTabsProps {
  mode: ExplorerInputMode;
  onModeChange: (mode: ExplorerInputMode) => void;
}

export function CodeInputTabs({ mode, onModeChange }: CodeInputTabsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const modes: { id: ExplorerInputMode; icon: any }[] = [
    { id: "Paste Code", icon: ClipboardPaste },
    { id: "Upload Screenshot", icon: UploadCloud },
    { id: "Camera Capture", icon: Camera },
  ];

  return (
    <div className="flex flex-wrap gap-2 sm:gap-2.5 mb-6" role="tablist">
      {modes.map(({ id: m, icon: Icon }) => {
        const isSelected = mode === m;
        return (
          <button
            key={m}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onModeChange(m)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
              isSelected
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] border-[#29D3C2] shadow-[0_0_15px_-3px_rgba(41,211,194,0.3)]"
                  : "bg-[#1E2022] text-white border-[#1E2022]"
                : isDark
                ? "bg-[#161B22] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#30363D]/80"
                : "bg-white border-[#E5E5E0] text-[#5A5C5E] hover:text-[#1E2022]"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{m}</span>
          </button>
        );
      })}
    </div>
  );
}
