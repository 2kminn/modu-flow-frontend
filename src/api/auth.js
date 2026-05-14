import { apiClient, getApiBaseUrl, getApiErrorMessage } from "@/api/client";

const SOCIAL_PROVIDERS = new Set(["google", "kakao", "naver"]);
export const SOCIAL_LOGIN_RETURN_TO_KEY = "moduflow:social-login-return-to:v1";

function unwrapApiResponse(payload) {
  if (!payload) return payload;
  if (payload?.data && Object.prototype.hasOwnProperty.call(payload, "status")) {
    return payload.data;
  }
  return payload;
}

export async function loginWithEmail({ email, password }) {
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const res = await apiClient.post("/api/v1/auth/login", { email: normalizedEmail, password });
    const data = unwrapApiResponse(res?.data);
    const accessToken = data?.accessToken;
    if (!accessToken) {
      return {
        ok: false,
        message: "로그인 응답에 accessToken이 없어요.",
        httpStatus: res?.status ?? null,
        debug: { response: res?.data ?? null }
      };
    }
    return {
      ok: true,
      accessToken,
      user: data?.user ?? null,
      tokenType: data?.tokenType,
      expiresInSeconds: data?.expiresInSeconds,
      email: data?.email ?? data?.user?.email,
      debug: { response: res?.data ?? null }
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

  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return {
      ok: false,
      message: "소셜 로그인을 시작하려면 VITE_API_BASE_URL 설정이 필요해요."
    };
  }

  return {
    ok: true,
    url: `${baseUrl}/oauth2/authorization/${normalizedProvider}`
  };
}

export async function signupWithEmail({ email, password }) {
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const res = await apiClient.post("/api/v1/auth/signup", {
      email: normalizedEmail,
      password
    });
    const data = unwrapApiResponse(res?.data);
    const accessToken = data?.accessToken;
    if (!accessToken) {
      return {
        ok: false,
        message: "회원가입 응답에 accessToken이 없어요.",
        httpStatus: res?.status ?? null,
        debug: { response: res?.data ?? null }
      };
    }
    return {
      ok: true,
      accessToken,
      user: data?.user ?? null,
      tokenType: data?.tokenType,
      expiresInSeconds: data?.expiresInSeconds,
      email: data?.email ?? data?.user?.email,
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
      message: getErrorMessage(e),
      httpStatus: e?.response?.status ?? null,
      debug: { response: e?.response?.data ?? null }
    };
  }
}
