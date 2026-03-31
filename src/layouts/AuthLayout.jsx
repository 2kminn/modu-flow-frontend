import { useLayoutEffect } from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "@/theme/ThemeProvider";

export default function AuthLayout() {
  const { setThemeOverride } = useTheme();

  useLayoutEffect(() => {
    setThemeOverride("light");
    return () => setThemeOverride(null);
  }, [setThemeOverride]);

  return (
    <div className="min-h-dvh bg-[color:var(--c-bg)] text-[color:var(--c-text)]">
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[color:var(--c-bg)]">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-black/10 blur-3xl dark:bg-white/10" />
        <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-black/10 blur-3xl dark:bg-white/10" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-black/5 blur-3xl dark:bg-white/5" />
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--c-bg)] via-[color:var(--c-bg)] to-[color:var(--c-surface-2)]" />
      </div>

      <div className="mx-auto max-w-[480px] px-4 pb-10 pt-10">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-3 py-1.5 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[color:var(--c-text)]" />
            <span className="text-[11px] font-extrabold tracking-wide">
              moduflow
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-[1.15] tracking-tight">
            모두의 운동 흐름을
            <br />
            매일 이어가요
          </h1>
          <p className="mt-3 text-sm font-semibold text-[color:var(--c-muted)]">
            로그인/회원가입은 현재 더미 동작입니다.
          </p>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
