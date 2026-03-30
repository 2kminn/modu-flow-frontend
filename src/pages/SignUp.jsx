import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function SignUp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);

  function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password || !confirmPassword) {
      setError("모든 항목을 입력해 주세요.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }

    setAuthToken("dummy-token");
    navigate("/", { replace: true });
  }

  return (
    <Card>
      <p className="text-[11px] font-extrabold tracking-wide text-slate-500">
        moduflow
      </p>
      <h2 className="mt-1 text-lg font-bold">회원가입</h2>
      <p className="mt-1 text-sm font-semibold text-slate-600">
        계정을 만들고 흐름을 시작해요.
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
              autoComplete="new-password"
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

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">
            비밀번호 확인
          </span>
          <div className="relative mt-1">
            <input
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm shadow-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-2 grid w-10 place-items-center rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] transition"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={
                showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"
              }
            >
              <EyeIcon visible={showConfirmPassword} />
            </button>
          </div>
        </label>

        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}

        <Button type="submit">회원가입</Button>

        <p className="text-center text-sm text-slate-600">
          이미 계정이 있나요?{" "}
          <Link className="font-semibold text-sky-700" to="/login">
            로그인
          </Link>
        </p>
      </form>
    </Card>
  );
}
