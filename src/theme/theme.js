const THEME_KEY = "theme";

export function getStoredTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === "dark" || value === "light") return value;
    return null;
  } catch {
    return null;
  }
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function applyTheme(theme) {
  try {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  } catch {
    // ignore
  }
}

