import { useTheme } from "@/theme/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "화이트 모드로 전환" : "다크 모드로 전환"}
      onClick={toggleTheme}
      className={[
        "relative inline-flex h-11 w-[72px] items-center rounded-full border shadow-sm transition duration-200 active:scale-[0.98] hover:bg-[color:var(--c-surface-2)]",
        "border-[color:var(--c-border)] bg-[color:var(--c-surface)]",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="absolute left-3 text-[11px] font-extrabold text-[color:var(--c-muted-2)]">
        L
      </span>
      <span className="absolute right-3 text-[11px] font-extrabold text-[color:var(--c-muted-2)]">
        D
      </span>

      <span
        aria-hidden="true"
        className={[
          "absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border shadow-sm transition-transform",
          "border-[color:var(--c-border)] bg-[color:var(--c-surface-2)]",
          isDark ? "translate-x-[36px]" : "translate-x-[4px]"
        ].join(" ")}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </span>
    </button>
  );
}
