"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Theme } from "@/lib/theme";
import { STORAGE_KEYS } from "@/lib/constants";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent) => void;
  setTheme: (theme: Theme) => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
  isMounted: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) as Theme | null;
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
        if (saved === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        // Light theme is the default for first-time visitors
        setThemeState("light");
        document.documentElement.classList.remove("dark");
      }
    } catch {
      setThemeState("light");
      document.documentElement.classList.remove("dark");
    }
    setIsMounted(true);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.THEME, t);
        if (t === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch (e) {
      console.warn("Could not save theme preference:", e);
    }
  }, []);

  const toggleTheme = useCallback((_e?: React.MouseEvent) => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isMounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
