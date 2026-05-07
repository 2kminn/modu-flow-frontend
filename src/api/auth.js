import { apiClient } from "@/api/client";

function unwrapApiResponse(payload) {
  if (!payload) return payload;
  if (payload?.data && Object.prototype.hasOwnProperty.call(payload, "status")) {
    return payload.data;
  }
  return payload;
}

function getErrorMessage(error) {
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.code;
  if (serverMessage) return String(serverMessage);
  return error?.message ? String(error.message) : "요청에 실패했어요.";
}

export async function loginWithEmail({ email, password }) {
  try {
    const res = await apiClient.post("/auth/login", { email, password });
    const data = unwrapApiResponse(res?.data);
    const accessToken = data?.accessToken;
    if (!accessToken) {
      return { ok: false, message: "로그인 응답에 accessToken이 없어요." };
    }
    return { ok: true, accessToken, tokenType: data?.tokenType, expiresInSeconds: data?.expiresInSeconds, email: data?.email };
  } catch (e) {
    return { ok: false, message: getErrorMessage(e), httpStatus: e?.response?.status ?? null };
  }
}

export async function signupWithEmail({ email, password, confirmPassword }) {
  try {
    const res = await apiClient.post("/auth/signup", { email, password, confirmPassword });
    const data = unwrapApiResponse(res?.data);
    const accessToken = data?.accessToken;
    // Some backends issue token on signup; if not, we still treat signup as success.
    return {
      ok: true,
      accessToken: accessToken ?? null,
      tokenType: data?.tokenType,
      expiresInSeconds: data?.expiresInSeconds,
      email: data?.email
    };
  } catch (e) {
    return { ok: false, message: getErrorMessage(e), httpStatus: e?.response?.status ?? null };
  }
}

