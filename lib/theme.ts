export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "codeatlas-theme";

export const THEME_CONFIG = {
  light: {
    bgPage: "#FAF9F5",
    bgSurface: "#FFFFFF",
    bgElevated: "#FFFFFF",
    textPrimary: "#1E2022",
    textSecondary: "#5A5C5E",
    primary: "#6C4DFF",
    border: "#E5E5E0",
    palette: {
      violet: "#EAE5FF",
      mint: "#D7F7EA",
      yellow: "#FFF0BF",
      coral: "#FFE0E3",
    },
  },
  dark: {
    bgPage: "#0E1116",
    bgSurface: "#161B22",
    bgElevated: "#161B22",
    textPrimary: "#E6EDF3",
    textSecondary: "#8B949E",
    primary: "#29D3C2",
    secondary: "#8B7CFF",
    border: "#30363D",
    bgCode: "#0D1117",
  },
};
