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
      <p className="mt-1 text-sm text-slate-600">
        가입한 이메일로 재설정 링크를 보내요.
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

        {message ? (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            {message}
          </p>
        ) : null}

        <Button type="submit">링크 보내기 (더미)</Button>

        <p className="text-center text-sm text-slate-600">
          로그인으로 돌아가기{" "}
          <Link className="font-semibold text-sky-700" to="/login">
            로그인
          </Link>
        </p>
      </form>
    </Card>
  );
}

