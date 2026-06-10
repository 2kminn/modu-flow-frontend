import axios from "axios";
import { getAuthToken, clearAuthToken } from "@/auth/auth";
import { replaceAuthorizationHeader } from "@/auth/authHeaders";

const STORAGE_API_BASE_URL_KEY = "moduflow:api-base-url:v1";
export const DEFAULT_API_BASE_URL = "https://3-39-194-42.sslip.io";
export const API_ERROR_EVENT = "moduflow:api-error";

function normalizeBaseUrl(value) {
  if (!value) return "";
  return String(value).trim().replace(/\/+$/, "");
}

function isHttpsPage() {
  return typeof window !== "undefined" && window.location?.protocol === "https:";
}

function canUseBaseUrl(value) {
  return Boolean(value && !(isHttpsPage() && value.startsWith("http://")));
}

function resolveBaseUrl() {
  // Production always uses the same-origin Vercel rewrite in vercel.json.
  // This also prevents a stale mobile runtime override from reintroducing CORS failures.
  if (import.meta.env.PROD) return "";

  if (typeof window !== "undefined") {
    const fromGlobal = normalizeBaseUrl(
      window.__MODUFLOW_API_BASE_URL__ ?? window.__MODUFLOW_CONFIG__?.apiBaseUrl
    );
    if (canUseBaseUrl(fromGlobal)) return fromGlobal;

    try {
      const fromStorage = normalizeBaseUrl(
        window.localStorage.getItem(STORAGE_API_BASE_URL_KEY)
      );
      if (canUseBaseUrl(fromStorage)) return fromStorage;
    } catch {
      // ignore
    }
  }

  const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (canUseBaseUrl(envUrl)) return envUrl;
  return DEFAULT_API_BASE_URL;
}

export function getApiBaseUrl() {
  return resolveBaseUrl() || null;
}

export function setApiBaseUrl(nextBaseUrl) {
  if (typeof window === "undefined") return;
  if (import.meta.env.PROD) {
    try {
      window.localStorage.removeItem(STORAGE_API_BASE_URL_KEY);
    } catch {
      // ignore
    }
    apiClient.defaults.baseURL = undefined;
    return;
  }

  const value = normalizeBaseUrl(nextBaseUrl);
  try {
    if (!value || !canUseBaseUrl(value)) {
      window.localStorage.removeItem(STORAGE_API_BASE_URL_KEY);
    } else {
      window.localStorage.setItem(STORAGE_API_BASE_URL_KEY, value);
    }
  } catch {
    // ignore
  }
  apiClient.defaults.baseURL = canUseBaseUrl(value) ? value : resolveBaseUrl() || undefined;
}

export function getApiErrorMessage(error, fallback = "요청에 실패했어요.") {
  if (error?.userMessage) return String(error.userMessage);

  const status = error?.response?.status;
  if (status === 400) return "입력한 내용을 다시 확인해 주세요.";
  if (status === 401) return "로그인이 필요해요. 다시 로그인해 주세요.";
  if (status === 403) return "이 작업을 진행할 권한이 없어요.";
  if (status === 404) return "요청한 정보를 찾을 수 없어요.";
  if (status === 409) return "이미 등록된 정보예요. 입력 내용을 확인해 주세요.";
  if (status === 422) return "입력한 내용을 확인해 주세요.";
  if (status === 429) return "요청이 많아요. 잠시 후 다시 시도해 주세요.";
  if (status >= 500) return "서비스 연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.";
  if (!error?.response) return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  return fallback;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (pathname === "/login" || pathname === "/oauth/callback") return;
  const redirect = encodeURIComponent(`${pathname}${search || ""}`);
  window.location.replace(`/login?redirect=${redirect}`);
}

function emitApiError(message) {
  if (typeof window === "undefined" || !message) return;
  try {
    window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail: { message } }));
  } catch {
    // ignore
  }
}

const baseURL = resolveBaseUrl();

export const apiClient = axios.create({
  baseURL: baseURL || undefined
});

apiClient.interceptors.request.use((config) => {
  if (!apiClient.defaults.baseURL && !config.baseURL) {
    const url = String(config.url || "");
    if (import.meta.env.DEV && url.startsWith("/api/")) {
      const error = new Error("API 주소(VITE_API_BASE_URL)가 설정되지 않았어요.");
      error.userMessage = error.message;
      emitApiError(error.userMessage);
      throw error;
    }
  }

  config.headers = config.headers ?? {};
  const token = getAuthToken();
  replaceAuthorizationHeader(config.headers, token, config.skipAuth);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = getApiErrorMessage(error);

    if (error?.config?.skipAuthRedirect) {
      return Promise.reject(error);
    }

    if (status === 401) {
      clearAuthToken();
      error.userMessage = "로그인이 만료되었어요. 다시 로그인해 주세요.";
      emitApiError(error.userMessage);
      redirectToLogin();
    } else if (status === 403) {
      error.userMessage = message || "접근 권한이 없어요.";
      emitApiError(error.userMessage);
    } else if (status === 422) {
      error.userMessage = message || "입력값을 확인해 주세요.";
      emitApiError(error.userMessage);
    }
    return Promise.reject(error);
  }
);
