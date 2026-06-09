import {
  apiClient,
  DEFAULT_API_BASE_URL,
  getApiBaseUrl,
  getApiErrorMessage
} from "@/api/client";

const SOCIAL_PROVIDERS = new Set(["google", "kakao"]);
export const SOCIAL_LOGIN_RETURN_TO_KEY = "moduflow:social-login-return-to:v1";
export const SOCIAL_LOGIN_PROVIDER_KEY = "moduflow:social-login-provider:v1";

function pickDisplayName(source) {
  if (!source || typeof source !== "object") return "";
  return String(
    source.name ??
      source.nickname ??
      source.userName ??
      source.displayName ??
      source.user?.name ??
      source.user?.nickname ??
      source.user?.userName ??
      source.user?.displayName ??
      ""
  ).trim();
}

function unwrapData(value) {
  return value?.data && typeof value.data === "object" ? value.data : value;
}

function normalizeAccessToken(value) {
  return String(value || "").trim().replace(/^Bearer\s+/i, "");
}

function pickRoles(source) {
  if (!source || typeof source !== "object") return [];
  const roles =
    source.roles ??
    source.role ??
    source.auth ??
    source.authorities ??
    source.authority ??
    source.permissions ??
    source.user?.roles ??
    source.user?.role ??
    source.user?.auth ??
    source.user?.authorities ??
    source.user?.authority ??
    source.user?.permissions;
  return Array.isArray(roles) ? roles : roles ? [roles] : [];
}

export async function loginWithEmail({ email, password, userId }) {
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUserId = String(userId || "").trim();
    const res = await apiClient.post(
      "/api/v1/auth/login",
      {
        email: normalizedEmail,
        password,
        ...(normalizedUserId ? { userId: normalizedUserId } : {})
      },
      { skipAuth: true }
    );
    const response = res?.data;
    const data = unwrapData(response) ?? {};
    const accessToken = normalizeAccessToken(data.accessToken ?? data.token ?? data.jwt);
    if (!accessToken) {
      return {
        ok: false,
        message: "로그인 응답에 accessToken이 없어요.",
        httpStatus: res?.status ?? null,
        debug: { response: response ?? null }
      };
    }
    return {
      ok: true,
      accessToken,
      user: data?.user ?? null,
      tokenType: data?.tokenType,
      expiresInSeconds: data?.expiresInSeconds,
      email: data?.email ?? data?.user?.email,
      name: pickDisplayName(data),
      roles: pickRoles(data),
      debug: { response: response ?? null }
    };
  } catch (e) {
    const httpStatus = e?.response?.status ?? null;
    const baseUrl = getApiBaseUrl();
    if (httpStatus === 404 && !baseUrl) {
      return {
        ok: false,
        message:
          "API 주소(VITE_API_BASE_URL)가 설정되지 않았어요. 배포/폰 환경에서는 빌드 환경변수 또는 런타임 설정이 필요해요.",
        httpStatus,
        debug: { response: e?.response?.data ?? null }
      };
    }
    return {
      ok: false,
      message: getApiErrorMessage(e),
      httpStatus,
      debug: { response: e?.response?.data ?? null }
    };
  }
}

export function getSocialLoginUrl(provider) {
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  if (!SOCIAL_PROVIDERS.has(normalizedProvider)) {
    return {
      ok: false,
      message: "지원하지 않는 소셜 로그인 provider예요."
    };
  }

  const path = `/oauth2/authorization/${normalizedProvider}`;
  // OAuth starts with a top-level browser navigation, so it can safely use the
  // backend origin directly. Production API calls still use the same-origin proxy.
  const baseUrl = getApiBaseUrl() ?? DEFAULT_API_BASE_URL;

  return {
    ok: true,
    url: `${baseUrl}${path}`
  };
}

export async function signupWithEmail({ email, password, name }) {
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(name || "").trim();
    const res = await apiClient.post(
      "/api/v1/auth/signup",
      {
        email: normalizedEmail,
        password,
        name: normalizedName
      },
      { skipAuth: true }
    );
    const response = res?.data;
    const data = unwrapData(response) ?? {};
    const accessToken = normalizeAccessToken(data.accessToken ?? data.token ?? data.jwt);
    if (!accessToken) {
      return {
        ok: false,
        message: "회원가입 응답에 accessToken이 없어요.",
        httpStatus: res?.status ?? null,
        debug: { response: response ?? null }
      };
    }
    return {
      ok: true,
      accessToken,
      user: data?.user ?? null,
      tokenType: data?.tokenType,
      expiresInSeconds: data?.expiresInSeconds,
      email: data?.email ?? data?.user?.email,
      name: pickDisplayName(data) || normalizedName,
      roles: pickRoles(data),
      debug: { response: response ?? null }
    };
  } catch (e) {
    return {
      ok: false,
      message: getApiErrorMessage(e),
      httpStatus: e?.response?.status ?? null,
      debug: { response: e?.response?.data ?? null }
    };
  }
}

export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  try {
    const res = await apiClient.patch("/api/v1/auth/password", {
      currentPassword,
      newPassword,
      newPasswordConfirm: confirmPassword
    });
    return {
      ok: true,
      debug: { response: res?.data ?? null }
    };
  } catch (e) {
    return {
      ok: false,
      message: getApiErrorMessage(e),
      httpStatus: e?.response?.status ?? null,
      debug: { response: e?.response?.data ?? null }
    };
  }
}
