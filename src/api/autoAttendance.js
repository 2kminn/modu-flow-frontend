import { apiClient } from "@/api/client";
import {
  getStoredAuthIdentity,
  getStoredAuthUserId,
  isDevTestAuthToken
} from "@/auth/auth";
import { getUserStorageKey } from "@/auth/userStorage";

export const AUTO_ATTENDANCE_STORAGE_KEY = "moduflow:auto-attendance-enabled:v1";
const AUTO_ATTENDANCE_STORAGE_KEY_PREFIX = `${AUTO_ATTENDANCE_STORAGE_KEY}:`;
export const AUTO_ATTENDANCE_EVENT = "moduflow:auto-attendance";

function getAutoAttendanceStorageKey() {
  return getUserStorageKey(
    AUTO_ATTENDANCE_STORAGE_KEY_PREFIX,
    getStoredAuthUserId(),
    getStoredAuthIdentity()
  );
}

export function isAutoAttendanceEnabled() {
  if (typeof window === "undefined") return true;
  try {
    const value = window.localStorage.getItem(getAutoAttendanceStorageKey());
    return value == null ? true : value === "true";
  } catch {
    return true;
  }
}

export function saveAutoAttendanceEnabled(enabled) {
  const next = Boolean(enabled);
  if (typeof window === "undefined") return next;
  try {
    window.localStorage.setItem(getAutoAttendanceStorageKey(), String(next));
    window.dispatchEvent(new CustomEvent(AUTO_ATTENDANCE_EVENT, { detail: next }));
  } catch {
    // ignore
  }
  return next;
}

export async function fetchAutoAttendanceEnabled() {
  if (isDevTestAuthToken()) return isAutoAttendanceEnabled();
  const res = await apiClient.get("/api/v1/settings");
  const data = res?.data?.data ?? res?.data;
  return data?.autoAttendanceEnabled !== false;
}

export async function updateAutoAttendanceEnabled(enabled) {
  const next = Boolean(enabled);
  if (!isDevTestAuthToken()) {
    await apiClient.put("/api/v1/settings", {
      autoAttendanceEnabled: next
    });
  }
  return saveAutoAttendanceEnabled(next);
}
