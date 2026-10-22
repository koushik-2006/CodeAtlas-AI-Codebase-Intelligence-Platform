"use client";

import { useTheme } from "./ThemeProvider";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { theme } = useTheme();

  const iconSizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-11 h-11 text-base",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <span className={`inline-flex items-center gap-2.5 font-extrabold tracking-tight ${textSizes[size]}`}>
      <span
        className={`grid place-items-center rounded-xl transition-all duration-200 ${iconSizes[size]} ${
          theme === "light"
            ? "bg-[#6C4DFF] shadow-sm"
            : "bg-[#0D111B] border border-[#242B39] shadow-[0_0_15px_-3px_rgba(41,211,194,0.3)]"
        }`}
      >
        <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top isometric diamond */}
          <path d="M10 2L17 6L10 10L3 6L10 2Z" fill="#FFC53D" />
          {/* Left face */}
          <path d="M3 6L10 10V18L3 14V6Z" fill={theme === "light" ? "#FFFFFF" : "#29D3C2"} />
          {/* Right face */}
          <path d="M10 10L17 6V14L10 18V10Z" fill={theme === "light" ? "#FF5A5F" : "#8B7CFF"} />
        </svg>
      </span>
      <span className="font-extrabold text-[#19143D] dark:text-[#F3F5FA] tracking-tight">
        CodeAtlas
      </span>
    </span>
  );
}
