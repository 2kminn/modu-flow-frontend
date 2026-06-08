export const AUTO_ATTENDANCE_STORAGE_KEY = "moduflow:auto-attendance-enabled:v1";
export const AUTO_ATTENDANCE_EVENT = "moduflow:auto-attendance";

export function isAutoAttendanceEnabled() {
  if (typeof window === "undefined") return true;
  try {
    const value = window.localStorage.getItem(AUTO_ATTENDANCE_STORAGE_KEY);
    return value == null ? true : value === "true";
  } catch {
    return true;
  }
}

export function saveAutoAttendanceEnabled(enabled) {
  const next = Boolean(enabled);
  if (typeof window === "undefined") return next;
  try {
    window.localStorage.setItem(AUTO_ATTENDANCE_STORAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent(AUTO_ATTENDANCE_EVENT, { detail: next }));
  } catch {
    // ignore
  }
  return next;
}
