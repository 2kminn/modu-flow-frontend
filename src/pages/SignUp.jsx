import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { setAuthToken } from "@/auth/auth";

export default function SignUp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      <h2 className="text-lg font-bold">회원가입</h2>
      <p className="mt-1 text-sm text-slate-600">
        기본 정보로 계정을 생성해요.
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
          <input
            type="password"
            autoComplete="new-password"
            placeholder="password"
            className="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">
            비밀번호 확인
          </span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="password"
            className="mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
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
