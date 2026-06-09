import { apiClient } from "@/api/client";
import { validateWorkoutItemDraft } from "@/api/validation";
import {
  getAuthToken,
  getStoredAuthIdentity,
  getStoredAuthUserId,
  isDevTestAuthToken
} from "@/auth/auth";

const ROUTINE_STORAGE_KEY = "moduflow:routines-by-day:v1";
const ROUTINE_STORAGE_KEY_PREFIX = "moduflow:routines-by-day:v1:";
const GUEST_ROUTINE_STORAGE_KEY = `${ROUTINE_STORAGE_KEY_PREFIX}guest`;
const ROUTINE_REST_DAYS_STORAGE_KEY_PREFIX = "moduflow:routine-rest-days:v1:";
const DAY_KEYS = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function decodeBase64Url(value) {
  try {
    const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return atob(padded);
  } catch {
    return "";
  }
}

function getJwtIdentity(token) {
  if (!token || typeof token !== "string") return "";
  const parts = token.split(".");
  if (parts.length < 2) return "";
  const payloadText = decodeBase64Url(parts[1]);
  if (!payloadText) return "";
  const payload = safeJsonParse(payloadText);
  if (!payload || typeof payload !== "object") return "";
  return (
    payload.sub ??
    payload.userId ??
    payload.id ??
    payload.email ??
    payload.username ??
    ""
  );
}

function hashString(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function sanitizeRestDays(restDays) {
  return Array.isArray(restDays)
    ? [...new Set(restDays.filter((dayKey) => DAY_KEYS.has(dayKey)))]
    : [];
}

function extractRestDays(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.restDays)) return sanitizeRestDays(data.restDays);
  if (data.routines && typeof data.routines === "object" && Array.isArray(data.routines.restDays)) {
    return sanitizeRestDays(data.routines.restDays);
  }
  return [];
}

function hasRestDays(data) {
  if (!data || typeof data !== "object") return false;
  if (Array.isArray(data.restDays)) return true;
  return Boolean(
    data.routines &&
      typeof data.routines === "object" &&
      Array.isArray(data.routines.restDays)
  );
}

function extractRoutinesByDay(data) {
  if (!data || typeof data !== "object") return {};
  const source =
    data.routines && typeof data.routines === "object" && !Array.isArray(data.routines)
      ? data.routines
      : data;
  const out = Object.create(null);
  for (const [dayKey, list] of Object.entries(source)) {
    if (!DAY_KEYS.has(dayKey)) continue;
    if (!Array.isArray(list)) continue;
    out[dayKey] = list.filter((it) => it && typeof it === "object");
  }
  return out;
}

export function getRoutineStorageKey() {
  const token = getAuthToken();
  if (!token) return GUEST_ROUTINE_STORAGE_KEY;

  const identity = String(
    getStoredAuthUserId() || getStoredAuthIdentity() || getJwtIdentity(token) || ""
  ).trim();
  if (identity) {
    return `${ROUTINE_STORAGE_KEY_PREFIX}user:${encodeURIComponent(identity)}`;
  }

  return `${ROUTINE_STORAGE_KEY_PREFIX}token:${hashString(token)}`;
}

export function getRoutineRestDaysStorageKey() {
  const routineKey = getRoutineStorageKey();
  const suffix = routineKey.startsWith(ROUTINE_STORAGE_KEY_PREFIX)
    ? routineKey.slice(ROUTINE_STORAGE_KEY_PREFIX.length)
    : "guest";
  return `${ROUTINE_REST_DAYS_STORAGE_KEY_PREFIX}${suffix}`;
}

export function loadRoutinesFromLocalStorage() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(getRoutineStorageKey());
    if (!raw) return {};
    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return extractRoutinesByDay(parsed);
  } catch {
    return {};
  }
}

function cacheRoutinesToStorageKey(storageKey, routinesByDay) {
  if (typeof window === "undefined") return;
  try {
    const out = extractRoutinesByDay(routinesByDay);
    window.localStorage.setItem(storageKey, JSON.stringify(out));
  } catch {
    // ignore
  }
}

export function cacheRoutinesToLocalStorage(routinesByDay) {
  cacheRoutinesToStorageKey(getRoutineStorageKey(), routinesByDay);
}

export function loadRoutineRestDaysFromLocalStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getRoutineRestDaysStorageKey());
    if (!raw) return [];
    const parsed = safeJsonParse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((dayKey) => DAY_KEYS.has(dayKey));
  } catch {
    return [];
  }
}

function loadRoutineRestDaysFromStorageKey(storageKey) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = safeJsonParse(raw);
    return sanitizeRestDays(parsed);
  } catch {
    return [];
  }
}

function cacheRoutineRestDaysToStorageKey(storageKey, restDays, emitEvent = true) {
  if (typeof window === "undefined") return;
  try {
    const safeRestDays = sanitizeRestDays(restDays);
    window.localStorage.setItem(storageKey, JSON.stringify(safeRestDays));
    if (emitEvent) {
      window.dispatchEvent(
        new CustomEvent("moduflow:routine-rest-days", {
          detail: { restDays: safeRestDays }
        })
      );
    }
  } catch {
    // ignore
  }
}

export function cacheRoutineRestDaysToLocalStorage(restDays) {
  cacheRoutineRestDaysToStorageKey(getRoutineRestDaysStorageKey(), restDays);
}

export function removeLegacyRoutineCache() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ROUTINE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function fetchRoutines() {
  if (isDevTestAuthToken()) {
    return {
      ...loadRoutinesFromLocalStorage(),
      restDays: loadRoutineRestDaysFromLocalStorage()
    };
  }

  const userId = getStoredAuthUserId();
  const routineStorageKey = getRoutineStorageKey();
  const restDaysStorageKey = getRoutineRestDaysStorageKey();
  const res = await apiClient.get("/api/v1/routines", {
    params: userId ? { userId } : undefined
  });
  const data = res?.data;
  if (data && typeof data === "object") {
    const restDays = hasRestDays(data)
      ? extractRestDays(data)
      : loadRoutineRestDaysFromStorageKey(restDaysStorageKey);
    cacheRoutinesToStorageKey(routineStorageKey, data);
    cacheRoutineRestDaysToStorageKey(
      restDaysStorageKey,
      restDays,
      getRoutineStorageKey() === routineStorageKey
    );
    return {
      ...extractRoutinesByDay(data),
      restDays
    };
  }
  return {};
}

function validationError(message) {
  const error = new Error(message);
  error.userMessage = message;
  return error;
}

// Backend RoutineItemDto supports: { id, name, sets, weight, exerciseId, reps, note }
function toBackendRoutineItem(item) {
  if (!item || typeof item !== "object") return null;
  if (!String(item.name ?? "").trim()) return null;
  const result = validateWorkoutItemDraft(item);
  if (!result.ok) throw validationError(result.message);
  const { id, name, sets, weight, exerciseId, reps, note } = result.item;
  return {
    id,
    name,
    sets,
    weight,
    exerciseId,
    reps,
    note
  };
}

export function buildRoutinesPayload(routinesByDay, restDays) {
  const payload = Object.entries(extractRoutinesByDay(routinesByDay)).reduce((acc, [dayKey, list]) => {
    const items = Array.isArray(list) ? list : [];
    acc[dayKey] = items.map(toBackendRoutineItem).filter(Boolean);
    return acc;
  }, {});
  payload.restDays = sanitizeRestDays(restDays ?? routinesByDay?.restDays);
  return payload;
}

export async function saveRoutines(routinesByDay, restDays) {
  const payload = buildRoutinesPayload(routinesByDay, restDays);
  if (isDevTestAuthToken()) {
    cacheRoutinesToLocalStorage(routinesByDay);
    cacheRoutineRestDaysToLocalStorage(payload.restDays);
    return payload;
  }

  const userId = getStoredAuthUserId();
  const routineStorageKey = getRoutineStorageKey();
  const restDaysStorageKey = getRoutineRestDaysStorageKey();
  const res = await apiClient.put("/api/v1/routines", payload, {
    params: userId ? { userId } : undefined
  });
  cacheRoutinesToStorageKey(routineStorageKey, routinesByDay);
  cacheRoutineRestDaysToStorageKey(
    restDaysStorageKey,
    payload.restDays,
    getRoutineStorageKey() === routineStorageKey
  );
  return res?.data;
}
