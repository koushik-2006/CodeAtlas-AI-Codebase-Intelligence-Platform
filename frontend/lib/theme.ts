export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "codeatlas-theme";

export const THEME_CONFIG = {
  light: {
    bgPage: "#F8FAFC",
    bgSurface: "#FFFFFF",
    bgElevated: "#F1F5F9",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    primary: "#7C5CFC",
    secondary: "#06B6D4",
    border: "#E2E8F0",
    palette: {
      violet: "#EDE9FE",
      mint: "#CCFBF1",
      yellow: "#FEF3C7",
      coral: "#FEE2E2",
    },
  },
  dark: {
    bgPage: "#0B1020",
    bgSurface: "#111827",
    bgElevated: "#151D30",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    primary: "#7C5CFC",
    secondary: "#22D3EE",
    border: "#1E293B",
    bgCode: "#0D1322",
  },
};
