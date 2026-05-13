import { apiClient, getApiBaseUrl } from "@/api/client";

function unwrapApiResponse(payload) {
  if (!payload) return payload;
  if (payload?.data && Object.prototype.hasOwnProperty.call(payload, "status")) {
    return payload.data;
  }
  return payload;
}

function getErrorMessage(error) {
  const serverMessage =
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.response?.data?.code;

  if (serverMessage != null) {
    if (typeof serverMessage === "string") return serverMessage;
    if (typeof serverMessage === "number" || typeof serverMessage === "boolean") {
      return String(serverMessage);
    }
    try {
      return JSON.stringify(serverMessage);
    } catch {
      return "요청에 실패했어요.";
    }
  }

  if (error?.message) return String(error.message);
  return "요청에 실패했어요.";
}

export async function loginWithEmail({ email, password }) {
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const res = await apiClient.post("/auth/login", { email: normalizedEmail, password });
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
      tokenType: data?.tokenType,
      expiresInSeconds: data?.expiresInSeconds,
      email: data?.email,
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
      message: getErrorMessage(e),
      httpStatus,
      debug: { response: e?.response?.data ?? null }
    };
  }
}

export async function signupWithEmail({ email, password, confirmPassword }) {
  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const res = await apiClient.post("/auth/signup", {
      email: normalizedEmail,
      password,
      confirmPassword
    });
    const data = unwrapApiResponse(res?.data);
    const accessToken = data?.accessToken;
    // Some backends issue token on signup; if not, we still treat signup as success.
    return {
      ok: true,
      accessToken: accessToken ?? null,
      tokenType: data?.tokenType,
      expiresInSeconds: data?.expiresInSeconds,
      email: data?.email,
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

export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  try {
    const res = await apiClient.patch("/api/v1/auth/password", {
      currentPassword,
      newPassword,
      confirmPassword
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
