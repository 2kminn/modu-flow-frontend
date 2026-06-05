import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { setAuthToken } from "@/auth/auth";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { signupWithEmail } from "@/api/auth";

export default function SignUp() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setDebugInfo(null);

    const trimmedName = name.trim();

    if (!email.trim() || !password || !confirmPassword) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    if (trimmedName.length > 100) {
      setError("이름은 최대 100자까지 입력할 수 있어요.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }

    setLoading(true);
    const signupResult = await signupWithEmail({
      email,
      password,
      confirmPassword,
      name: trimmedName
    });

    if (!signupResult.ok) {
      setLoading(false);
      const suffix = signupResult.httpStatus ? ` (HTTP ${signupResult.httpStatus})` : "";
      setError(`${signupResult.message || "회원가입에 실패했어요."}${suffix}`);
      setDebugInfo(signupResult.debug || null);
      return;
    }

    setAuthToken(signupResult.accessToken, signupResult.email || email, signupResult.name || name);
    setLoading(false);
    navigate("/", { replace: true });
  }

  return (
    <Card>
      <p className="bg-[linear-gradient(135deg,var(--c-primary),var(--c-purple))] bg-clip-text text-[11px] font-extrabold tracking-wide text-transparent">
        moduflow
      </p>
      <h2 className="mt-1 text-lg font-bold">회원가입</h2>
      <p className="mt-1 text-sm font-semibold text-[color:var(--c-muted)]">
        계정을 만들고 흐름을 시작해요.
      </p>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <FloatingLabelInput
          id="signup-name"
          label="이름"
          type="text"
          autoComplete="name"
          maxLength={100}
          inputClassName="focus:border-[color:var(--c-primary)] focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
          leftAdornment={<User size={18} aria-hidden="true" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <FloatingLabelInput
          id="signup-email"
          label="이메일"
          type="email"
          inputMode="email"
          autoComplete="email"
          inputClassName="focus:border-[color:var(--c-primary)] focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
          leftAdornment={<Mail size={18} aria-hidden="true" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <FloatingLabelInput
          id="signup-password"
          label="비밀번호"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          inputClassName="focus:border-[color:var(--c-primary)] focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
          leftAdornment={<Lock size={18} aria-hidden="true" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightAdornment={
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-2xl text-[color:var(--c-muted-2)] transition hover:bg-[color:var(--c-surface-2)] hover:text-[color:var(--c-text)] active:scale-[0.98]"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? (
                <Eye size={20} aria-hidden="true" />
              ) : (
                <EyeOff size={20} aria-hidden="true" />
              )}
            </button>
          }
        />

        <FloatingLabelInput
          id="signup-confirm-password"
          label="비밀번호 확인"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          inputClassName="focus:border-[color:var(--c-primary)] focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
          leftAdornment={<Lock size={18} aria-hidden="true" />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          rightAdornment={
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-2xl text-[color:var(--c-muted-2)] transition hover:bg-[color:var(--c-surface-2)] hover:text-[color:var(--c-text)] active:scale-[0.98]"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={
                showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"
              }
            >
              {showConfirmPassword ? (
                <Eye size={20} aria-hidden="true" />
              ) : (
                <EyeOff size={20} aria-hidden="true" />
              )}
            </button>
          }
        />

        {error ? (
          <p className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] px-4 py-3 text-sm font-semibold text-[color:var(--c-text)]">
            {error}
          </p>
        ) : null}

        {import.meta.env.DEV && debugInfo?.response ? (
          <pre className="max-h-48 overflow-auto rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-3 text-[11px] font-semibold text-[color:var(--c-muted-2)]">
            {JSON.stringify(debugInfo.response, null, 2)}
          </pre>
        ) : null}

        <Button type="submit" disabled={loading}>
          {loading ? "가입 중..." : "회원가입"}
        </Button>

        <p className="text-center text-sm text-[color:var(--c-muted)]">
          이미 계정이 있나요?{" "}
          <Link className="font-semibold text-[color:var(--c-primary)] underline decoration-[color:var(--c-border-strong)] underline-offset-4 hover:text-[color:var(--c-purple)]" to="/login">
            로그인
          </Link>
        </p>
      </form>
    </Card>
  );
}
