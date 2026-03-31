import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { applyTheme, getStoredTheme, setStoredTheme } from "@/theme/theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => getStoredTheme() ?? "light");
  const [overrideTheme, setOverrideTheme] = useState(null);
  const effectiveTheme = overrideTheme ?? theme;

  useEffect(() => {
    setStoredTheme(theme);
  }, [theme]);

  useLayoutEffect(() => {
    applyTheme(effectiveTheme);
  }, [effectiveTheme]);

  const value = useMemo(() => {
    return {
      theme: effectiveTheme,
      userTheme: theme,
      setTheme,
      setThemeOverride: setOverrideTheme,
      toggleTheme: () =>
        setTheme((prev) => (prev === "dark" ? "light" : "dark"))
    };
  }, [effectiveTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
