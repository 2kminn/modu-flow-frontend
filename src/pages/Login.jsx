import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import {
  clearAuthToken,
  DEV_TEST_AUTH_TOKEN,
  isAdminSession,
  setAuthToken
} from "@/auth/auth";
import { Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck } from "lucide-react";
import {
  getSocialLoginUrl,
  loginWithEmail,
  SOCIAL_LOGIN_PROVIDER_KEY,
  SOCIAL_LOGIN_RETURN_TO_KEY
} from "@/api/auth";
import { getNativeDeviceId } from "@/native/androidBridge";

function safeRedirectPath(value) {
  if (!value || typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = useMemo(() => {
    const state = location.state;
    if (state?.from?.pathname) {
      return safeRedirectPath(`${state.from.pathname}${state.from.search || ""}`);
    }
    const params = new URLSearchParams(location.search);
    return safeRedirectPath(params.get("redirect"));
  }, [location.search, location.state]);
  const prefillEmail = useMemo(() => {
    const state = location.state;
    return state?.email ? String(state.email) : "";
  }, [location.state]);

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  function onSocialLogin(provider) {
    setError(null);
    setDebugInfo(null);
    const result = getSocialLoginUrl(provider);

    if (!result.ok) {
      setError(result.message || "소셜 로그인을 시작할 수 없어요.");
      return;
    }

    try {
      window.sessionStorage.setItem(SOCIAL_LOGIN_RETURN_TO_KEY, fromPath);
      window.sessionStorage.setItem(SOCIAL_LOGIN_PROVIDER_KEY, provider);
    } catch {
      // ignore
    }

    clearAuthToken();
    window.location.href = result.url;
  }

  async function runLogin(nextEmail, nextPassword) {
    setError(null);
    setDebugInfo(null);

    if (!String(nextEmail || "").trim() || !nextPassword) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    const result = await loginWithEmail({
      email: nextEmail,
      password: nextPassword,
      userId: getNativeDeviceId()
    });
    setLoading(false);

    if (!result.ok) {
      const suffix = result.httpStatus ? ` (HTTP ${result.httpStatus})` : "";
      setError(`${result.message || "로그인에 실패했어요."}${suffix}`);
      setDebugInfo(result.debug || null);
      return;
    }

    const requestedEmail = String(nextEmail || "").trim().toLowerCase();
    const responseEmail = String(result.email || "").trim().toLowerCase();
    if (responseEmail && responseEmail !== requestedEmail) {
      setError("로그인 응답의 계정 정보가 일치하지 않아요. 다시 로그인해 주세요.");
      setDebugInfo(result.debug || null);
      return;
    }

    setAuthToken(result.accessToken, requestedEmail, result.name, "email", result.roles);
    navigate(isAdminSession() ? "/admin" : fromPath, { replace: true });
  }

  async function onSubmit(e) {
    e.preventDefault();
    await runLogin(email, password);
  }

  return (
    <Card>
      <p className="bg-[linear-gradient(135deg,var(--c-primary),var(--c-purple))] bg-clip-text text-[11px] font-extrabold tracking-wide text-transparent">
        moduflow
      </p>
      <h2 className="mt-1 text-lg font-bold">로그인</h2>
      <p className="mt-1 text-sm font-semibold text-[color:var(--c-muted)]">
        오늘의 운동 흐름을 이어가요.
      </p>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <FloatingLabelInput
          id="login-email"
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
          id="login-password"
          label="비밀번호"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
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

        <div className="text-center text-sm">
          <Link className="font-semibold text-[color:var(--c-primary)] underline decoration-[color:var(--c-border-strong)] underline-offset-4 hover:text-[color:var(--c-purple)]" to="/forgot-password">
            비밀번호 찾기
          </Link>
        </div>

        <Button type="submit" disabled={loading} className="gap-2 bg-[linear-gradient(135deg,var(--c-primary),var(--c-purple))]">
          <LogIn size={18} aria-hidden="true" />
          {loading ? "로그인 중..." : "로그인"}
        </Button>

        {import.meta.env.DEV ? (
          <>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => {
                setAuthToken(DEV_TEST_AUTH_TOKEN, "cms-test", "", "email", ["ROLE_ADMIN"]);
                navigate("/admin", { replace: true });
              }}
            >
              <ShieldCheck size={18} aria-hidden="true" />
              CMS 테스트 로그인
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={() => {
                // DEV convenience: bypass backend auth and just set a dummy token.
                // This is only for local/testing flows.
                setAuthToken(DEV_TEST_AUTH_TOKEN, "dev-test");
                navigate(fromPath, { replace: true });
              }}
            >
              테스트 로그인
            </Button>
          </>
        ) : null}

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
              onClick={() => onSocialLogin("kakao")}
              aria-label="카카오로 로그인"
              disabled={loading}
              className="grid h-14 w-14 place-items-center rounded-full bg-[#FEE500] shadow-sm transition duration-200 hover:brightness-105 hover:shadow-md hover:scale-[1.03] active:scale-[0.98]"
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
              disabled={loading}
              className="grid h-14 w-14 place-items-center rounded-full border border-[color:var(--c-border)] bg-[color:var(--c-surface)] shadow-sm transition duration-200 hover:bg-[color:var(--c-surface-2)] hover:shadow-md hover:scale-[1.03] active:scale-[0.98]"
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
          <Link className="font-semibold text-[color:var(--c-purple)] underline decoration-[color:var(--c-border-strong)] underline-offset-4 hover:text-[color:var(--c-primary)]" to="/signup">
            회원가입
          </Link>
        </p>
      </form>
    </Card>
  );
}
