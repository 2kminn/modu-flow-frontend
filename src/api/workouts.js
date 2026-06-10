import { apiClient } from "@/api/client";
import {
  getAuthToken,
  getStoredAuthIdentity,
  getStoredAuthUserId,
  isDevTestAuthToken
} from "@/auth/auth";
import {
  validateDateRange,
  validateWorkoutCountDelta,
  validateWorkoutItemDraft
} from "@/api/validation";

export const WORKOUT_HISTORY_STORAGE_KEY = "moduflow:workout-history:v1";
const WORKOUT_HISTORY_STORAGE_KEY_PREFIX = `${WORKOUT_HISTORY_STORAGE_KEY}:`;
const GUEST_WORKOUT_HISTORY_STORAGE_KEY = `${WORKOUT_HISTORY_STORAGE_KEY_PREFIX}guest`;
export const WORKOUT_HISTORY_EVENT = "moduflow:workout-history";

function validationError(message) {
  const error = new Error(message);
  error.userMessage = message;
  return error;
}

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

function parseWorkoutHistory(raw) {
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") return {};
  return parsed;
}

function removeDemoWorkoutSeed(history) {
  const demoIds = new Set(["w1", "w2", "w3", "w4", "w5"]);
  let changed = false;
  const next = Object.create(null);

  for (const [date, items] of Object.entries(history || {})) {
    if (!Array.isArray(items)) continue;
    const isDemoSeed =
      items.length > 0 &&
      items.every((item) => demoIds.has(String(item?.id || "")));
    if (isDemoSeed) {
      changed = true;
      continue;
    }
    next[date] = items;
  }

  return { history: changed ? next : history, changed };
}

export function getWorkoutHistoryStorageKey() {
  const token = getAuthToken();
  if (!token) return GUEST_WORKOUT_HISTORY_STORAGE_KEY;

  const identity = String(
    getStoredAuthUserId() || getStoredAuthIdentity() || getJwtIdentity(token) || ""
  ).trim();
  if (identity) {
    return `${WORKOUT_HISTORY_STORAGE_KEY_PREFIX}user:${encodeURIComponent(identity)}`;
  }

  return `${WORKOUT_HISTORY_STORAGE_KEY_PREFIX}token:${hashString(token)}`;
}

export function loadWorkoutHistoryFromLocalStorage() {
  if (typeof window === "undefined") return {};
  const storageKey = getWorkoutHistoryStorageKey();
  return loadWorkoutHistoryFromStorageKey(storageKey);
}

function loadWorkoutHistoryFromStorageKey(storageKey) {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(storageKey);
  const parsed = parseWorkoutHistory(raw);
  if (Object.keys(parsed).length) {
    const cleaned = removeDemoWorkoutSeed(parsed);
    if (cleaned.changed) {
      window.localStorage.setItem(storageKey, JSON.stringify(cleaned.history));
    }
    return cleaned.history;
  }

  const token = getAuthToken();
  if (token) return {};

  const legacy = parseWorkoutHistory(window.localStorage.getItem(WORKOUT_HISTORY_STORAGE_KEY));
  if (!Object.keys(legacy).length) return {};
  const cleanedLegacy = removeDemoWorkoutSeed(legacy);

  if (storageKey !== WORKOUT_HISTORY_STORAGE_KEY) {
    window.localStorage.setItem(storageKey, JSON.stringify(cleanedLegacy.history));
    window.localStorage.removeItem(WORKOUT_HISTORY_STORAGE_KEY);
  }

  return cleanedLegacy.history;
}

function writeWorkoutHistoryToStorageKey(storageKey, history) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(history || {}));
  window.dispatchEvent(
    new CustomEvent(WORKOUT_HISTORY_EVENT, { detail: { history, storageKey } })
  );
}

function normalizeWorkoutItem(item) {
  const result = validateWorkoutItemDraft(item);
  if (!result.ok) throw validationError(result.message);
  return result.item;
}

function normalizeWorkoutItems(items) {
  return (Array.isArray(items) ? items : []).map(normalizeWorkoutItem);
}

function isNetworkError(error) {
  return Boolean(error && !error.response);
}

function getLocalWorkoutsInRange(from, to, storageKey = getWorkoutHistoryStorageKey()) {
  const history = loadWorkoutHistoryFromStorageKey(storageKey);
  return Object.entries(history)
    .filter(([date]) => date >= from && date <= to)
    .map(([date, items]) => ({ date, items: normalizeWorkoutItems(items) }));
}

function cacheWorkoutDay(date, items, storageKey = getWorkoutHistoryStorageKey()) {
  if (typeof window === "undefined") return;
  const history = loadWorkoutHistoryFromStorageKey(storageKey);
  const safeItems = normalizeWorkoutItems(items);
  if (safeItems.length) history[date] = safeItems;
  else delete history[date];
  writeWorkoutHistoryToStorageKey(storageKey, history);
}

function cacheWorkoutList(
  workouts,
  storageKey = getWorkoutHistoryStorageKey(),
  { from, to } = {}
) {
  if (typeof window === "undefined" || !Array.isArray(workouts)) return;
  const history = loadWorkoutHistoryFromStorageKey(storageKey);
  if (from && to) {
    for (const date of Object.keys(history)) {
      if (date >= from && date <= to) delete history[date];
    }
  }
  for (const workout of workouts) {
    const date = String(workout?.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    history[date] = normalizeWorkoutItems(workout?.items);
  }
  writeWorkoutHistoryToStorageKey(storageKey, history);
}

function cacheWorkoutItemPatch(
  date,
  itemId,
  patch,
  storageKey = getWorkoutHistoryStorageKey()
) {
  if (typeof window === "undefined") return;
  const history = loadWorkoutHistoryFromStorageKey(storageKey);
  const list = Array.isArray(history[date]) ? history[date] : [];
  history[date] = list.map((it) => (it?.id === itemId ? { ...it, ...patch } : it));
  writeWorkoutHistoryToStorageKey(storageKey, history);
}

function cacheWorkoutItemDelete(date, itemId, storageKey = getWorkoutHistoryStorageKey()) {
  if (typeof window === "undefined") return;
  const history = loadWorkoutHistoryFromStorageKey(storageKey);
  const list = Array.isArray(history[date]) ? history[date] : [];
  const filtered = list.filter((it) => it?.id !== itemId);
  if (filtered.length) history[date] = filtered;
  else delete history[date];
  writeWorkoutHistoryToStorageKey(storageKey, history);
}

export async function fetchWorkouts({ from, to }) {
  const range = validateDateRange(from, to);
  if (!range.ok) throw validationError(range.message);
  const storageKey = getWorkoutHistoryStorageKey();
  if (isDevTestAuthToken()) {
    return getLocalWorkoutsInRange(from, to, storageKey);
  }
  try {
    const res = await apiClient.get("/api/v1/workouts", { params: { from, to } });
    const workouts = res?.data?.workouts ?? [];
    cacheWorkoutList(workouts, storageKey, { from, to });
    return workouts;
  } catch (e) {
    if (isNetworkError(e)) return getLocalWorkoutsInRange(from, to, storageKey);
    throw e;
  }
}

export async function fetchWorkoutCounts({ from, to }) {
  const range = validateDateRange(from, to);
  if (!range.ok) throw validationError(range.message);
  const res = await apiClient.get("/api/v1/workouts/counts", { params: { from, to } });
  return res?.data?.counts ?? [];
}

export async function replaceWorkoutDay(date, items) {
  const safeItems = normalizeWorkoutItems(items);
  const storageKey = getWorkoutHistoryStorageKey();
  if (isDevTestAuthToken()) {
    cacheWorkoutDay(date, safeItems, storageKey);
    return { ok: true, date, items: safeItems };
  }
  try {
    const res = await apiClient.put(`/api/v1/workouts/${date}`, { items: safeItems });
    cacheWorkoutDay(date, safeItems, storageKey);
    return res?.data;
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    cacheWorkoutDay(date, safeItems, storageKey);
    return { ok: true, date, items: safeItems, localOnly: true };
  }
}

export async function updateWorkoutItem({ date, itemId, patch }) {
  const result = validateWorkoutItemDraft({ name: "patch", ...patch });
  if (!result.ok) throw validationError(result.message);
  const storageKey = getWorkoutHistoryStorageKey();
  if (isDevTestAuthToken()) {
    cacheWorkoutItemPatch(date, itemId, {
      sets: result.item.sets,
      reps: result.item.reps,
      weight: result.item.weight,
      note: result.item.note
    }, storageKey);
    return { ok: true };
  }
  try {
    const res = await apiClient.patch(`/api/v1/workouts/${date}/items/${itemId}`, {
      sets: result.item.sets,
      reps: result.item.reps,
      weight: result.item.weight,
      note: result.item.note
    });
    cacheWorkoutItemPatch(date, itemId, {
      sets: result.item.sets,
      reps: result.item.reps,
      weight: result.item.weight,
      note: result.item.note
    }, storageKey);
    return res?.data;
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    cacheWorkoutItemPatch(date, itemId, {
      sets: result.item.sets,
      reps: result.item.reps,
      weight: result.item.weight,
      note: result.item.note
    }, storageKey);
    return { ok: true, localOnly: true };
  }
}

export async function deleteWorkoutItem({ date, itemId }) {
  const storageKey = getWorkoutHistoryStorageKey();
  if (isDevTestAuthToken()) {
    cacheWorkoutItemDelete(date, itemId, storageKey);
    return { ok: true };
  }
  try {
    const res = await apiClient.delete(`/api/v1/workouts/${date}/items/${itemId}`);
    cacheWorkoutItemDelete(date, itemId, storageKey);
    return res?.data;
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    cacheWorkoutItemDelete(date, itemId, storageKey);
    return { ok: true, localOnly: true };
  }
}

export async function incrementWorkoutDayCount({ date, delta } = {}) {
  const result = validateWorkoutCountDelta(delta);
  if (!result.ok) throw validationError(result.message);
  const body = result.value == null ? undefined : { delta: result.value };
  const res = await apiClient.post(`/api/v1/workouts/${date}/count`, body);
  return res?.data;
}
