import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic dynamic tokens
        canvas: {
          light: "#FAF9FF",
          dark: "#070A12",
        },
        panel: {
          light: "#FFFFFF",
          dark: "#0D111B",
          darker: "#0A0F19",
          elevated: "#111725",
        },
        border: {
          light: "#E8E5F4",
          dark: "#242B39",
        },
        ink: {
          DEFAULT: "#19143D",
          light: "#19143D",
          dark: "#F3F5FA",
        },
        muted: {
          DEFAULT: "#68677D",
          light: "#68677D",
          dark: "#9AA4B5",
        },
        // Theme 1 (Light Accent Palette)
        brand: {
          DEFAULT: "#6C4DFF",
          light: "#6C4DFF",
          dark: "#4B31D6",
          soft: "#EAE5FF",
        },
        sun: {
          DEFAULT: "#FFC53D",
          soft: "#FFF0BF",
          dark: "#E0A100",
        },
        mint: {
          DEFAULT: "#2FD6A0",
          soft: "#D7F7EA",
          dark: "#1BA97B",
        },
        coral: {
          DEFAULT: "#FF5A5F",
          soft: "#FFE0E3",
          dark: "#D93A40",
        },
        lilac: "#EAE5FF",
        rose: "#FFE0E3",
        mintsoft: "#D7F7EA",
        sunsoft: "#FFF0BF",
        sky: "#E6E9FF",

        // Theme 2 (Dark Accent Palette)
        cyan: {
          DEFAULT: "#29D3C2",
          glow: "rgba(41, 211, 194, 0.25)",
        },
        techviolet: "#8B7CFF",
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
