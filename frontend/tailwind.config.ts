import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./providers/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic dynamic tokens
        canvas: {
          light: "#F8FAFC",
          dark: "#0B1020",
        },
        panel: {
          light: "#FFFFFF",
          dark: "#111827",
          darker: "#0F172A",
          elevated: "#151D30",
        },
        border: {
          light: "#E2E8F0",
          dark: "#1E293B",
        },
        ink: {
          DEFAULT: "#0F172A",
          light: "#0F172A",
          dark: "#F8FAFC",
        },
        muted: {
          DEFAULT: "#64748B",
          light: "#64748B",
          dark: "#94A3B8",
        },
        // Primary Brand Accent: Electric Violet
        brand: {
          DEFAULT: "#7C5CFC",
          light: "#7C5CFC",
          dark: "#6A4BE8",
          soft: "#EDE9FE",
        },
        sun: {
          DEFAULT: "#FFC53D",
          soft: "#FEF3C7",
          dark: "#E0A100",
        },
        mint: {
          DEFAULT: "#2FD6A0",
          soft: "#CCFBF1",
          dark: "#1BA97B",
        },
        coral: {
          DEFAULT: "#FF5A5F",
          soft: "#FEE2E2",
          dark: "#D93A40",
        },
        lilac: "#EDE9FE",
        rose: "#FEE2E2",
        mintsoft: "#CCFBF1",
        sunsoft: "#FEF3C7",
        sky: "#E0F2FE",

        // Secondary Accent: Cyan
        cyan: {
          DEFAULT: "#22D3EE",
          glow: "rgba(34, 211, 238, 0.25)",
        },
        techviolet: "#7C5CFC",
        techgold: "#F3C969",
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 20px 40px -20px rgba(108, 77, 255, 0.15)",
        darkglow: "0 0 30px -10px rgba(41, 211, 194, 0.18)",
        purpleglow: "0 0 30px -10px rgba(139, 124, 255, 0.25)",
      },
      keyframes: {
        scan: {
          "0%, 100%": { top: "8%" },
          "50%": { top: "88%" },
        },
        marquee: {
          to: { transform: "translateX(-50%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        scan: "scan 3.2s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        glow: "pulseGlow 2.5s ease-in-out infinite",
      },
    },
  },
} satisfies Config;
