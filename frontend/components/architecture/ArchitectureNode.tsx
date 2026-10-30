"use client";

import { useTheme } from "@/hooks/useTheme";

interface ArchitectureNodeProps {
  id: string;
  name: string;
  type: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ArchitectureNode({
  name,
  type,
  isSelected,
  onClick,
}: ArchitectureNodeProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-left border transition-all ${
        isSelected
          ? isDark
            ? "bg-[#29D3C2]/20 border-[#29D3C2] text-[#29D3C2] shadow-[0_0_15px_-3px_rgba(41,211,194,0.3)] font-bold"
            : "bg-[#6C4DFF]/15 border-[#6C4DFF] text-[#6C4DFF] shadow-sm font-bold"
          : isDark
          ? "bg-[#111725] border-[#242B39] text-[#F3F5FA] hover:border-[#29D3C2]/50"
          : "bg-white border-[#E8E5F4] text-[#19143D] hover:border-[#6C4DFF]/50"
      }`}
    >
      <span className="text-[10px] font-mono opacity-70 block">{type}</span>
      <span className="text-xs font-semibold">{name}</span>
    </button>
  );
}
