import { apiClient } from "@/api/client";
import { validateWorkoutItemDraft } from "@/api/validation";

const ROUTINE_STORAGE_KEY = "moduflow:routines-by-day:v1";

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadRoutinesFromLocalStorage() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROUTINE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out = Object.create(null);
    const dayKeys = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
    for (const [dayKey, list] of Object.entries(parsed)) {
      if (!dayKeys.has(dayKey)) continue;
      if (!Array.isArray(list)) continue;
      out[dayKey] = list.filter((it) => it && typeof it === "object");
    }
    return out;
  } catch {
    return {};
  }
}

export function cacheRoutinesToLocalStorage(routinesByDay) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routinesByDay ?? {}));
  } catch {
    // ignore
  }
}

export async function fetchRoutines() {
  const res = await apiClient.get("/api/v1/routines");
  const data = res?.data;
  if (data && typeof data === "object") {
    cacheRoutinesToLocalStorage(data);
    return data;
  }
  return {};
}

// Backend RoutineItemDto supports: { id, name, sets, weight, exerciseId, reps }
function toBackendRoutineItem(item) {
  if (!item || typeof item !== "object") return null;
  const result = validateWorkoutItemDraft(item);
  if (!result.ok) throw new Error(result.message);
  const { id, name, sets, weight, exerciseId, reps } = result.item;
  return {
    id,
    name,
    sets,
    weight,
    exerciseId,
    reps
  };
}

export function buildRoutinesPayload(routinesByDay) {
  return Object.entries(routinesByDay ?? {}).reduce((acc, [dayKey, list]) => {
    const items = Array.isArray(list) ? list : [];
    acc[dayKey] = items.map(toBackendRoutineItem).filter(Boolean);
    return acc;
  }, {});
}

export async function saveRoutines(routinesByDay) {
  const payload = buildRoutinesPayload(routinesByDay);
  const res = await apiClient.put("/api/v1/routines", payload);
  cacheRoutinesToLocalStorage(routinesByDay);
  return res?.data;
}
