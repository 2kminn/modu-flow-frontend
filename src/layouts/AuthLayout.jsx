import { useLayoutEffect } from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "@/theme/ThemeProvider";
import { Dumbbell } from "lucide-react";

export default function AuthLayout() {
  const { setThemeOverride } = useTheme();

  useLayoutEffect(() => {
    setThemeOverride("light");
    return () => setThemeOverride(null);
  }, [setThemeOverride]);

  return (
    <div className="min-h-dvh bg-[color:var(--c-bg)] text-[color:var(--c-text)]">
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[linear-gradient(135deg,#EFF6FF,#F5F3FF)]">
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-[color:var(--c-bg)]" />
      </div>

      <div className="mx-auto max-w-[480px] px-4 pb-10 pt-10">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--c-border-strong)] bg-white/80 px-3 py-1.5 text-[color:var(--c-primary)] backdrop-blur">
            <Dumbbell size={14} aria-hidden="true" />
            <span className="text-[11px] font-extrabold tracking-wide">
              moduflow
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-[1.15] tracking-tight">
            모두의 운동 흐름을
            <br />
            <span className="bg-[linear-gradient(135deg,var(--c-primary),var(--c-purple))] bg-clip-text text-transparent">
              매일 이어가요
            </span>
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
