const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function safeLength(value) {
  return String(value ?? "").length;
}

export function normalizeExerciseIdentity(item) {
  if (!item || typeof item !== "object") return item;

  const exerciseId =
    String(item.exerciseId ?? "").trim() === "overhead-press"
      ? "shoulder-press"
      : item.exerciseId;
  const name =
    String(item.name ?? "").trim() === "오버헤드 프레스"
      ? "숄더 프레스"
      : item.name;

  if (exerciseId === item.exerciseId && name === item.name) return item;
  return { ...item, exerciseId, name };
}

export function toNumberOrNull(value) {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function validateWorkoutItemDraft(item) {
  const normalizedItem = normalizeExerciseIdentity(item);
  const errors = [];
  const name = String(normalizedItem?.name ?? "").trim();
  const id = normalizedItem?.id == null ? "" : String(normalizedItem.id);
  const exerciseId =
    normalizedItem?.exerciseId == null ? "" : String(normalizedItem.exerciseId);
  const note = normalizedItem?.note == null ? "" : String(normalizedItem.note);
  const sets = toNumberOrNull(normalizedItem?.sets);
  const reps = toNumberOrNull(normalizedItem?.reps);
  const weight = toNumberOrNull(normalizedItem?.weight);

  if (!name) errors.push("운동 이름은 필수입니다.");
  if (safeLength(name) > 100) errors.push("운동 이름은 최대 100자까지 입력할 수 있어요.");
  if (id && safeLength(id) > 36) errors.push("운동 기록 id는 최대 36자까지 허용됩니다.");
  if (exerciseId && safeLength(exerciseId) > 100) {
    errors.push("운동 id는 최대 100자까지 허용됩니다.");
  }
  if (note && safeLength(note) > 255) errors.push("메모는 최대 255자까지 입력할 수 있어요.");
  if (normalizedItem?.sets !== "" && normalizedItem?.sets != null && (!Number.isInteger(sets) || sets < 0 || sets > 999)) {
    errors.push("세트는 0~999 사이의 정수로 입력해 주세요.");
  }
  if (normalizedItem?.reps !== "" && normalizedItem?.reps != null && (!Number.isInteger(reps) || reps < 0 || reps > 999)) {
    errors.push("횟수는 0~999 사이의 정수로 입력해 주세요.");
  }
  if (normalizedItem?.weight !== "" && normalizedItem?.weight != null && (weight == null || weight < 0)) {
    errors.push("무게는 0 이상으로 입력해 주세요.");
  }

  return {
    ok: errors.length === 0,
    message: errors[0] || "",
    item: {
      id: id || undefined,
      exerciseId: exerciseId || undefined,
      name,
      note: note || undefined,
      sets,
      reps,
      weight
    }
  };
}

export function validateWorkoutCountDelta(delta) {
  if (delta == null || delta === "") return { ok: true, value: undefined, message: "" };
  const value = Number(delta);
  if (!Number.isInteger(value) || value < -100 || value > 100) {
    return { ok: false, value: null, message: "운동 count는 -100~100 사이의 정수로 입력해 주세요." };
  }
  return { ok: true, value, message: "" };
}

export function validateDateRange(from, to) {
  if (!DATE_RE.test(String(from || "")) || !DATE_RE.test(String(to || ""))) {
    return { ok: false, message: "날짜는 YYYY-MM-DD 형식이어야 합니다." };
  }
  if (from > to) {
    return { ok: false, message: "시작일은 종료일보다 이후일 수 없어요." };
  }
  return { ok: true, message: "" };
}
