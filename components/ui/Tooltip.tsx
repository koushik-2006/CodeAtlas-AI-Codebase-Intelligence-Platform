"use client";

import React, { useState } from "react";
import { useTheme } from "@/hooks/useTheme";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delayMs = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delayMs);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2";
      case "top":
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 px-2.5 py-1 text-[11px] font-semibold font-sans rounded-lg shadow-lg pointer-events-none whitespace-nowrap border transition-all ${getPositionClasses()} ${
            isDark
              ? "bg-[#111725] text-[#F3F5FA] border-[#242B39] shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              : "bg-[#19143D] text-white border-[#2b2361] shadow-md"
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
