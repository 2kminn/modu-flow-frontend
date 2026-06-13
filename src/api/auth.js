// 로그인·회원가입·OAuth·비밀번호 변경 API를 호출하고 다양한 서버 응답을 앱의 인증 형식으로 정규화한다.
import {
  apiClient,
  DEFAULT_API_BASE_URL,
  getApiBaseUrl,
  getApiErrorMessage
} from "@/api/client";
import { collectAuthRoles } from "@/auth/roles";

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

function pickUserId(source) {
  if (!source || typeof source !== "object") return "";
  return String(
    source.userId ??
      source.user_id ??
      source.memberId ??
      source.member_id ??
      source.id ??
      source.user?.userId ??
      source.user?.user_id ??
      source.user?.memberId ??
      source.user?.member_id ??
      source.user?.id ??
      ""
  ).trim();
}

export async function loginWithEmail({ email, password }) {
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const res = await apiClient.post(
      "/api/v1/auth/login",
      {
        email: normalizedEmail,
        password
      },
      { skipAuth: true }
    );
    const response = res?.data;
    const data = unwrapData(response) ?? {};
    const accessToken = normalizeAccessToken(data.accessToken ?? data.token ?? data.jwt);
    if (!accessToken) {
      return {
        ok: false,
        message: "로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요."
      };
    }
    return {
      ok: true,
      accessToken,
      user: data?.user ?? null,
      tokenType: data?.tokenType,
      expiresInSeconds: data?.expiresInSeconds,
      email: data?.email ?? data?.user?.email,
      userId: pickUserId(data),
      name: pickDisplayName(data),
      roles: collectAuthRoles(response, data)
    };
  } catch (e) {
    const httpStatus = e?.response?.status ?? null;
    if (httpStatus === 400 || httpStatus === 401) {
      return {
        ok: false,
        message: "이메일 또는 비밀번호가 올바르지 않아요."
      };
    }
    return {
      ok: false,
      message: getApiErrorMessage(e, "로그인에 실패했어요.")
    };
  }
}

export function getSocialLoginUrl(provider) {
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  if (!SOCIAL_PROVIDERS.has(normalizedProvider)) {
    return {
      ok: false,
      message: "지원하지 않는 로그인 방식이에요."
    };
  }

  const path = `/oauth2/authorization/${normalizedProvider}`;
  // OAuth는 브라우저 전체 이동으로 시작하므로 백엔드 주소를 직접 사용한다.
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
        message: "회원가입을 완료하지 못했어요. 잠시 후 다시 시도해 주세요."
      };
    }
    return {
      ok: true,
      accessToken,
      user: data?.user ?? null,
      tokenType: data?.tokenType,
      expiresInSeconds: data?.expiresInSeconds,
      email: data?.email ?? data?.user?.email,
      userId: pickUserId(data),
      name: pickDisplayName(data) || normalizedName,
      roles: collectAuthRoles(response, data)
    };
  } catch (e) {
    const httpStatus = e?.response?.status ?? null;
    if (httpStatus === 409) {
      return {
        ok: false,
        message: "이미 가입된 이메일이에요. 로그인하거나 다른 이메일을 사용해 주세요."
      };
    }
    return {
      ok: false,
      message: getApiErrorMessage(e, "회원가입에 실패했어요.")
    };
  }
}

export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  try {
    await apiClient.patch("/api/v1/auth/password", {
      currentPassword,
      newPassword,
      newPasswordConfirm: confirmPassword
    });
    return {
      ok: true
    };
  } catch (e) {
    return {
      ok: false,
      message: getApiErrorMessage(e, "비밀번호 변경에 실패했어요.")
    };
  }
}
