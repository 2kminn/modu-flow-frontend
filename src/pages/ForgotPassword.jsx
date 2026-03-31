import { useState } from "react";
import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);

  function onSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("이메일을 입력해 주세요.");
      return;
    }
    setMessage("비밀번호 재설정 링크를 보냈어요. (더미)");
  }

  return (
    <Card>
      <h2 className="text-lg font-bold">비밀번호 찾기</h2>
      <p className="mt-1 text-sm text-[color:var(--c-muted)]">
        가입한 이메일로 재설정 링크를 보내요.
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
            className="mt-1 h-12 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm shadow-sm outline-none placeholder:text-[color:var(--c-muted-2)] transition duration-200 focus:border-[color:var(--c-border-strong)] focus:ring-4 focus:ring-[color:var(--c-focus-ring)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {message ? (
          <p className="rounded-2xl bg-[color:var(--c-surface-2)] px-4 py-3 text-sm font-semibold text-[color:var(--c-text)]">
            {message}
          </p>
        ) : null}

        <Button type="submit">링크 보내기 (더미)</Button>

        <p className="text-center text-sm text-[color:var(--c-muted)]">
          로그인으로 돌아가기{" "}
          <Link className="font-semibold text-[color:var(--c-text)] underline decoration-[color:var(--c-border-strong)] underline-offset-4 hover:decoration-[color:var(--c-text)]" to="/login">
            로그인
          </Link>
        </p>
      </form>
    </Card>
  );
}
