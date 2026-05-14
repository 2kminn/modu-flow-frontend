import axios from "axios";
import { getAuthToken, clearAuthToken } from "@/auth/auth";

const STORAGE_API_BASE_URL_KEY = "moduflow:api-base-url:v1";
export const API_ERROR_EVENT = "moduflow:api-error";

function normalizeBaseUrl(value) {
  if (!value) return "";
  return String(value).trim().replace(/\/+$/, "");
}

function resolveBaseUrl() {
  const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (envUrl) return envUrl;

  if (typeof window === "undefined") return "";

  const fromGlobal = normalizeBaseUrl(
    window.__MODUFLOW_API_BASE_URL__ ?? window.__MODUFLOW_CONFIG__?.apiBaseUrl
  );
  if (fromGlobal) return fromGlobal;

  try {
    const fromStorage = normalizeBaseUrl(
      window.localStorage.getItem(STORAGE_API_BASE_URL_KEY)
    );
    if (fromStorage) return fromStorage;
  } catch {
    // ignore
  }

  return "";
}

export function getApiBaseUrl() {
  return resolveBaseUrl() || null;
}

export function setApiBaseUrl(nextBaseUrl) {
  if (typeof window === "undefined") return;
  const value = normalizeBaseUrl(nextBaseUrl);
  try {
    if (!value) window.localStorage.removeItem(STORAGE_API_BASE_URL_KEY);
    else window.localStorage.setItem(STORAGE_API_BASE_URL_KEY, value);
  } catch {
    // ignore
  }
  apiClient.defaults.baseURL = value || undefined;
}

export function getApiErrorMessage(error, fallback = "요청에 실패했어요.") {
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
      return fallback;
    }
  }

  if (error?.userMessage) return String(error.userMessage);
  if (error?.message) return String(error.message);
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

if (import.meta.env.DEV && baseURL.startsWith("http")) {
  try {
    const { hostname } = new URL(baseURL);
    if (hostname.endsWith(".ngrok")) {
      console.warn(
        `[api] VITE_API_BASE_URL host looks incomplete: ${hostname}. ` +
          "ngrok URLs usually end with .ngrok.io / .ngrok.app / .ngrok-free.app."
      );
    }
  } catch {
    // ignore
  }
}

export const apiClient = axios.create({
  baseURL: baseURL || undefined
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  config.headers = config.headers ?? {};

  if (!token) return config;

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = getApiErrorMessage(error);

    if (status === 401) {
      clearAuthToken();
      error.userMessage = "로그인이 만료되었어요. 다시 로그인해 주세요.";
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
