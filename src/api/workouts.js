import { apiClient } from "@/api/client";
import {
  validateDateRange,
  validateWorkoutCountDelta,
  validateWorkoutItemDraft
} from "@/api/validation";

function validationError(message) {
  const error = new Error(message);
  error.userMessage = message;
  return error;
}

export async function fetchWorkouts({ from, to }) {
  const range = validateDateRange(from, to);
  if (!range.ok) throw validationError(range.message);
  const res = await apiClient.get("/api/v1/workouts", { params: { from, to } });
  return res?.data?.workouts ?? [];
}

export async function fetchWorkoutCounts({ from, to }) {
  const range = validateDateRange(from, to);
  if (!range.ok) throw validationError(range.message);
  const res = await apiClient.get("/api/v1/workouts/counts", { params: { from, to } });
  return res?.data?.counts ?? [];
}

export async function replaceWorkoutDay(date, items) {
  const safeItems = (Array.isArray(items) ? items : []).map((item) => {
    const result = validateWorkoutItemDraft(item);
    if (!result.ok) throw validationError(result.message);
    return result.item;
  });
  const res = await apiClient.put(`/api/v1/workouts/${date}`, { items: safeItems });
  return res?.data;
}

export async function updateWorkoutItem({ date, itemId, patch }) {
  const result = validateWorkoutItemDraft({ name: "patch", ...patch });
  if (!result.ok) throw validationError(result.message);
  const res = await apiClient.patch(`/api/v1/workouts/${date}/items/${itemId}`, {
    sets: result.item.sets,
    reps: result.item.reps,
    weight: result.item.weight,
    note: result.item.note
  });
  return res?.data;
}

export async function deleteWorkoutItem({ date, itemId }) {
  const res = await apiClient.delete(`/api/v1/workouts/${date}/items/${itemId}`);
  return res?.data;
}

export async function incrementWorkoutDayCount({ date, delta } = {}) {
  const result = validateWorkoutCountDelta(delta);
  if (!result.ok) throw validationError(result.message);
  const body = result.value == null ? undefined : { delta: result.value };
  const res = await apiClient.post(`/api/v1/workouts/${date}/count`, body);
  return res?.data;
}
