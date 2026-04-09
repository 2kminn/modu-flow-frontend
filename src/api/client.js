import axios from "axios";
import { getAuthToken, clearAuthToken } from "@/auth/auth";

function normalizeBaseUrl(value) {
  if (!value) return "";
  return String(value).trim().replace(/\/+$/, "");
}

const baseURL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

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

  if (baseURL.includes("ngrok")) {
    config.headers["ngrok-skip-browser-warning"] =
      config.headers["ngrok-skip-browser-warning"] ?? "true";
  }

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
