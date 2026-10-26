"use client";

import { useTheme } from "@/hooks/useTheme";

const LANGUAGES = [
  "Python",
  "TypeScript",
  "Java",
  "Go",
  "Rust",
  "C++",
  "JavaScript",
  "Ruby",
  "PHP",
  "Kotlin",
];

const LIGHT_CHIP_COLORS = [
  "bg-[#EAE5FF] text-[#1E2022] border-[#D8CFFE]", // soft violet
  "bg-[#D7F7EA] text-[#1E2022] border-[#B9EED8]", // soft mint
  "bg-[#FFF0BF] text-[#1E2022] border-[#FCE18F]", // soft yellow
  "bg-[#FFE0E3] text-[#1E2022] border-[#FCC5CB]", // soft coral
];

export function LanguageTicker() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Duplicate list to ensure continuous ticker scrolling
  const tickerItems = [...LANGUAGES, ...LANGUAGES, ...LANGUAGES];

  return (
    <section
      aria-label="Supported programming languages"
      className="w-full overflow-hidden border-y border-[var(--border-color)] bg-[var(--bg-surface)]/60 py-3.5 transition-colors"
    >
      <div className="flex w-max animate-marquee gap-3 sm:gap-4 hover:[animation-play-state:paused]">
        {tickerItems.map((lang, idx) => {
          const lightColor = LIGHT_CHIP_COLORS[idx % LIGHT_CHIP_COLORS.length];

          return (
            <span
              key={`${lang}-${idx}`}
              className={`inline-flex items-center rounded-full px-4 py-1.5 font-mono text-xs font-semibold tracking-wide border transition-all ${
                isDark
                  ? "bg-[#161B22] border-[#30363D] text-[#29D3C2] hover:border-[#29D3C2]/60 hover:shadow-[0_0_12px_rgba(41,211,194,0.2)]"
                  : `${lightColor} shadow-xs hover:brightness-95`
              }`}
            >
              <span
                className={`mr-2 h-1.5 w-1.5 rounded-full ${
                  isDark ? "bg-[#29D3C2]" : "bg-[#6C4DFF]"
                }`}
              />
              {lang}
            </span>
          );
        })}
      </div>
    </section>
  );
}
