"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): "light" | "dark" {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme");
    const initialTheme: Theme =
      savedTheme === "light" || savedTheme === "dark" || savedTheme === "system"
        ? savedTheme
        : "system";

    setThemeState(initialTheme);
    setResolvedTheme(initialTheme === "system" ? getSystemTheme() : initialTheme);
  }, []);

  React.useEffect(() => {
    const applyTheme = () => {
      const nextResolvedTheme = theme === "system" ? getSystemTheme() : theme;
      setResolvedTheme(nextResolvedTheme);
      document.documentElement.classList.toggle("dark", nextResolvedTheme === "dark");
    };

    applyTheme();
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    window.localStorage.setItem("theme", nextTheme);
    setThemeState(nextTheme);
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}