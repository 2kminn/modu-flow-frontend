import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { setAuthToken } from "@/auth/auth";

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 6c5.4 0 9.3 4.66 10 6-.7 1.34-4.6 6-10 6S2.7 13.34 2 12c.7-1.34 4.6-6 10-6Zm0 2c-3.9 0-7 3.06-7.7 4 .7.94 3.8 4 7.7 4s7-3.06 7.7-4c-.7-.94-3.8-4-7.7-4Zm0 1.7a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6Z"
        />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.28 2.22a1 1 0 0 1 1.4.06l16.98 16.98a1 1 0 1 1-1.41 1.41l-2.3-2.3A10.8 10.8 0 0 1 12 20C6.6 20 2.7 15.34 2 14c.44-.85 2.22-3.25 5.04-4.9L2.34 4.4a1 1 0 0 1 .94-2.18ZM12 6c5.4 0 9.3 4.66 10 6-.32.62-1.36 2.16-3.06 3.53l-2.1-2.1c.97-.92 1.62-1.79 1.86-2.13-.7-.94-3.8-4-7.7-4-.75 0-1.47.11-2.15.3L7.2 5.95C8.64 5.35 10.26 5 12 5Zm-3.35 5.4a3.3 3.3 0 0 0 4.55 4.55l-4.55-4.55Z"
      />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = useMemo(() => {
    const state = location.state;
    return state?.from?.pathname || "/";
  }, [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  function onSocialLogin(provider) {
    setError(null);
    setAuthToken(`dummy-${provider}-token`);
    navigate(fromPath, { replace: true });
  }

  function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setAuthToken("dummy-token");
    navigate(fromPath, { replace: true });
  }

  return (
    <Card>
      <h2 className="text-lg font-bold">로그인</h2>
      <p className="mt-1 text-sm text-slate-600">
        이메일로 로그인해 주세요.
      </p>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">이메일</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">비밀번호</span>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm shadow-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-2 grid w-10 place-items-center rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] transition"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
        </label>

        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="text-center text-sm">
          <Link className="font-semibold text-sky-700" to="/forgot-password">
            비밀번호 찾기
          </Link>
        </div>

        <Button type="submit">로그인</Button>

        <div className="pt-2">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold text-slate-500">
              간편 로그인
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onSocialLogin("naver")}
              aria-label="네이버로 로그인"
              className="grid h-14 w-14 place-items-center rounded-full bg-[#03C75A] shadow-sm transition active:scale-[0.98]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="white"
                  d="M6 4h4.1l3.8 5.6V4H18v16h-4.1L10.1 14.4V20H6V4Z"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onSocialLogin("kakao")}
              aria-label="카카오로 로그인"
              className="grid h-14 w-14 place-items-center rounded-full bg-[#FEE500] shadow-sm transition active:scale-[0.98]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#3C1E1E"
                  d="M12 4C7.58 4 4 6.72 4 10.08c0 2.26 1.62 4.25 4.04 5.3L7.4 19.7a.6.6 0 0 0 .9.63l4.76-3.02c.32.03.64.04.98.04 4.42 0 8-2.72 8-6.27C22 6.72 16.42 4 12 4Z"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onSocialLogin("google")}
              aria-label="구글로 로그인"
              className="grid h-14 w-14 place-items-center rounded-full border border-slate-200 bg-white shadow-sm transition active:scale-[0.98]"
            >
              <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.1 0 5.9 1.1 8.1 3.1l6-6C34.4 2.9 29.5 1 24 1 14.7 1 6.7 6.4 3 14.3l7 5.4C11.7 13.1 17.4 9.5 24 9.5Z"
                />
                <path
                  fill="#34A853"
                  d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8.2h12.7c-.3 2-1.6 5-4.6 7.1l7.1 5.5c4.1-3.8 6.3-9.4 6.3-16.7Z"
                />
                <path
                  fill="#4285F4"
                  d="M10 28.7a14.5 14.5 0 0 1-.8-4.7c0-1.6.3-3.2.8-4.7l-7-5.4A24 24 0 0 0 0 24c0 3.9.9 7.6 3 10.1l7-5.4Z"
                />
                <path
                  fill="#FBBC05"
                  d="M24 47c6.5 0 12-2.1 16-5.8l-7.1-5.5c-2 1.4-4.6 2.4-8.9 2.4-6.6 0-12.3-3.7-15.2-9.4l-7 5.4C6.7 41.6 14.7 47 24 47Z"
                />
              </svg>
            </button>
          </div>
        </div>

        <p className="pt-1 text-center text-sm text-slate-600">
          계정이 없나요?{" "}
          <Link className="font-semibold text-sky-700" to="/signup">
            회원가입
          </Link>
        </p>
      </form>
    </Card>
  );
}
