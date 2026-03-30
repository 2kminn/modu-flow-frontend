import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { setAuthToken } from "@/auth/auth";
import { Eye, EyeOff } from "lucide-react";

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
      <p className="text-[11px] font-extrabold tracking-wide text-[color:var(--c-muted-2)]">
        moduflow
      </p>
      <h2 className="mt-1 text-lg font-bold">로그인</h2>
      <p className="mt-1 text-sm font-semibold text-[color:var(--c-muted)]">
        오늘의 운동 흐름을 이어가요.
      </p>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-xs font-semibold text-[color:var(--c-muted)]">
            이메일
          </span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-1 h-12 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm shadow-sm outline-none placeholder:text-[color:var(--c-muted-2)] focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-[color:var(--c-muted)]">
            비밀번호
          </span>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="password"
              className="h-12 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 pr-12 text-sm shadow-sm outline-none placeholder:text-[color:var(--c-muted-2)] focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-2 grid w-10 place-items-center rounded-2xl text-[color:var(--c-muted-2)] hover:bg-[color:var(--c-surface-2)] hover:text-[color:var(--c-text)] active:scale-[0.98] transition"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? (
                <Eye size={20} aria-hidden="true" />
              ) : (
                <EyeOff size={20} aria-hidden="true" />
              )}
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
            <span className="h-px flex-1 bg-[color:var(--c-border)]" />
            <span className="text-xs font-semibold text-[color:var(--c-muted-2)]">
              간편 로그인
            </span>
            <span className="h-px flex-1 bg-[color:var(--c-border)]" />
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
              className="grid h-14 w-14 place-items-center rounded-full border border-[color:var(--c-border)] bg-[color:var(--c-surface)] shadow-sm transition active:scale-[0.98]"
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

        <p className="pt-1 text-center text-sm text-[color:var(--c-muted)]">
          계정이 없나요?{" "}
          <Link className="font-semibold text-sky-700" to="/signup">
            회원가입
          </Link>
        </p>
      </form>
    </Card>
  );
}
