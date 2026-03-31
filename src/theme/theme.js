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
    root.classList.add("theme-changing");
    root.classList.toggle("dark", theme === "dark");
    const bg = getComputedStyle(root).getPropertyValue("--c-bg")?.trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && bg) meta.setAttribute("content", bg);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("theme-changing"));
    });
  } catch {
    // ignore
  }
}
