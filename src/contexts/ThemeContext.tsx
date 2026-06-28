"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type AppTheme = "dark" | "cream" | "sanook";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("dark");

  useEffect(() => {
    try {
      const userSetTheme = localStorage.getItem("nimbusdaily_theme_user_set") === "true";
      if (!userSetTheme) {
        localStorage.setItem("nimbusdaily_theme", "dark");
        setThemeState("dark");
        return;
      }
      const saved = localStorage.getItem("nimbusdaily_theme");
      if (saved === "dark" || saved === "cream" || saved === "sanook") setThemeState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
  }, [theme]);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem("nimbusdaily_theme", nextTheme);
      localStorage.setItem("nimbusdaily_theme_user_set", "true");
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const nextTheme = current === "dark" ? "cream" : current === "cream" ? "sanook" : "dark";
      try {
        localStorage.setItem("nimbusdaily_theme", nextTheme);
        localStorage.setItem("nimbusdaily_theme_user_set", "true");
      } catch {}
      return nextTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
