import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-[480px] px-4 pb-10 pt-10">
        <div className="mb-6">
          <p className="text-[11px] font-semibold tracking-wide text-slate-500">
            Healthcare PWA
          </p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight">
            건강한 습관을
            <br />
            매일 기록해요
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            로그인/회원가입은 더미 동작입니다.
          </p>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
