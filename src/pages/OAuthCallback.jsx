import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import { decodeJwtPayload, setAuthToken } from "@/auth/auth";
import { SOCIAL_LOGIN_PROVIDER_KEY, SOCIAL_LOGIN_RETURN_TO_KEY } from "@/api/auth";
import { fetchMyProfile } from "@/api/profile";

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

function safeGetSocialProvider() {
  try {
    return window.sessionStorage.getItem(SOCIAL_LOGIN_PROVIDER_KEY) || "social";
  } catch {
    return "social";
  }
}

function safeClearReturnTo() {
  try {
    window.sessionStorage.removeItem(SOCIAL_LOGIN_RETURN_TO_KEY);
    window.sessionStorage.removeItem(SOCIAL_LOGIN_PROVIDER_KEY);
  } catch {
    // ignore
  }
}

function safePath(value) {
  if (!value || typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function pickParam(params, keys) {
  for (const key of keys) {
    const value = params.get(key);
    if (String(value || "").trim()) return String(value).trim();
  }
  return "";
}

function pickClaim(payload, keys) {
  if (!payload || typeof payload !== "object") return "";
  for (const key of keys) {
    const value = payload[key];
    if (String(value || "").trim()) return String(value).trim();
  }
  return "";
}

export default function OAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => readParams(location), [location]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const providerError = params.get("error") || params.get("message");
    if (providerError) {
      setError("소셜 로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.");
      safeClearReturnTo();
      return;
    }

    const token = normalizeToken(
      params.get("accessToken") || params.get("token") || params.get("access_token")
    );

    if (!token) {
      setError("소셜 로그인을 완료하지 못했어요. 다시 시도해 주세요.");
      safeClearReturnTo();
      return;
    }

    const payload = decodeJwtPayload(token);
    const accountHint =
      pickParam(params, ["email", "userId", "username"]) ||
      pickClaim(payload, ["email", "preferred_username", "username", "userId", "sub"]);
    const userId =
      pickParam(params, ["userId", "user_id", "memberId", "member_id", "id"]) ||
      pickClaim(payload, ["userId", "user_id", "memberId", "member_id", "id", "sub"]);
    const profileName =
      pickParam(params, ["name", "nickname", "userName", "displayName"]) ||
      pickClaim(payload, ["name", "nickname", "userName", "displayName"]);
    const authProvider =
      pickParam(params, ["provider", "registrationId", "socialProvider"]) ||
      pickClaim(payload, ["provider", "registrationId", "socialProvider"]) ||
      safeGetSocialProvider();
    const role =
      pickParam(params, ["role", "roles", "authority", "authorities"]) ||
      pickClaim(payload, ["role", "roles", "authority", "authorities"]);

    let cancelled = false;
    async function completeLogin() {
      setAuthToken(token, accountHint, "", authProvider, role ? [role] : [], userId);
      try {
        await fetchMyProfile();
      } catch {
        // The OAuth token is authoritative. Some accounts cannot access /me.
      }

      if (cancelled) return;
      const nextPath = safePath(params.get("redirect") || safeGetReturnTo());
      safeClearReturnTo();
      navigate(nextPath, { replace: true });
    }

    completeLogin();
    return () => {
      cancelled = true;
    };
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
            className="inline-flex w-full items-center justify-center rounded-2xl border border-transparent bg-[linear-gradient(135deg,var(--c-primary),var(--c-primary-strong))] px-5 py-4 text-base font-semibold text-white shadow-sm transition duration-200 hover:brightness-105 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--c-surface)]"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
