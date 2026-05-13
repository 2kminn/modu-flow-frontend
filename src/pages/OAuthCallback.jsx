import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import { setAuthToken } from "@/auth/auth";
import { SOCIAL_LOGIN_RETURN_TO_KEY } from "@/api/auth";

function readParams(location) {
  const params = new URLSearchParams(location.search);
  const hash = String(location.hash || "").replace(/^#/, "");
  const hashParams = new URLSearchParams(hash);

  for (const [key, value] of hashParams.entries()) {
    if (!params.has(key)) params.set(key, value);
  }

  return params;
}

function normalizeToken(value) {
  if (!value) return null;
  return String(value).trim().replace(/^Bearer\s+/i, "");
}

function safeGetReturnTo() {
  try {
    return window.sessionStorage.getItem(SOCIAL_LOGIN_RETURN_TO_KEY) || "/";
  } catch {
    return "/";
  }
}

function safeClearReturnTo() {
  try {
    window.sessionStorage.removeItem(SOCIAL_LOGIN_RETURN_TO_KEY);
  } catch {
    // ignore
  }
}

function safePath(value) {
  if (!value || typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function OAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => readParams(location), [location]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const providerError = params.get("error") || params.get("message");
    if (providerError) {
      setError(providerError);
      safeClearReturnTo();
      return;
    }

    const token = normalizeToken(
      params.get("accessToken") || params.get("token") || params.get("access_token")
    );

    if (!token) {
      setError("로그인 응답에 accessToken이 없어요.");
      safeClearReturnTo();
      return;
    }

    setAuthToken(token);
    const nextPath = safePath(params.get("redirect") || safeGetReturnTo());
    safeClearReturnTo();
    navigate(nextPath, { replace: true });
  }, [navigate, params]);

  return (
    <Card>
      <p className="text-[11px] font-extrabold tracking-wide text-[color:var(--c-muted-2)]">
        moduflow
      </p>
      <h2 className="mt-1 text-lg font-bold">
        {error ? "소셜 로그인 실패" : "소셜 로그인 처리 중"}
      </h2>
      <p className="mt-2 text-sm font-semibold text-[color:var(--c-muted)]">
        {error || "잠시만 기다려 주세요."}
      </p>

      {error ? (
        <div className="mt-5">
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-black bg-black px-5 py-4 text-base font-semibold text-white shadow-sm transition duration-200 hover:bg-neutral-700 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--c-surface)]"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
