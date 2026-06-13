// 테마 값을 localStorage와 HTML 루트 클래스에 반영하고 브라우저 theme-color도 함께 갱신한다.
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
    // 저장소가 차단되면 현재 화면 테마만 유지한다.
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
    // DOM 접근이 불가능한 환경에서는 테마 적용을 건너뛴다.
  }
}
