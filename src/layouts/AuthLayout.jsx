import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-dvh text-slate-900">
      <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-950">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-500/30 blur-3xl" />
        <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-100" />
      </div>

      <div className="mx-auto max-w-[480px] px-4 pb-10 pt-10">
        <div className="mb-6 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span className="text-[11px] font-extrabold tracking-wide">
              moduflow
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-[1.15] tracking-tight">
            모두의 운동 흐름을
            <br />
            매일 이어가요
          </h1>
          <p className="mt-3 text-sm font-semibold text-white/75">
            로그인/회원가입은 현재 더미 동작입니다.
          </p>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
