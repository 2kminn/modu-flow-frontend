import axios from "axios";
import { getAuthToken, clearAuthToken } from "@/auth/auth";

const STORAGE_API_BASE_URL_KEY = "moduflow:api-base-url:v1";

function normalizeBaseUrl(value) {
  if (!value) return "";
  return String(value).trim().replace(/\/+$/, "");
}

function resolveBaseUrl() {
  const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (envUrl) return envUrl;

  if (typeof window === "undefined") return "";

  // In production (e.g. Vercel), we can safely use same-origin rewrites as a fallback.
  if (!import.meta.env.DEV) return "";

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
    if (status === 401) {
      clearAuthToken();
    }
    return Promise.reject(error);
  }
);
