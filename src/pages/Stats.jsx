import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import WeeklyWorkoutChart from "@/components/charts/WeeklyWorkoutChart";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getApiErrorMessage } from "@/api/client";
import { validateWorkoutItemDraft } from "@/api/validation";
import {
  fetchRoutines,
  loadRoutineRestDaysFromLocalStorage,
  loadRoutinesFromLocalStorage
} from "@/api/routines";
import {
  deleteWorkoutItem,
  fetchWorkouts,
  replaceWorkoutDay,
  updateWorkoutItem,
  WORKOUT_HISTORY_EVENT,
  WORKOUT_HISTORY_STORAGE_KEY
} from "@/api/workouts";

const DAY_LABELS = {
  sun: "일",
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토"
};

function formatMonth(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonthKorean(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function startWeekday(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0=Sun
}

function dayKeyFromDate(date) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[date.getDay()];
}

function dateFromDateString(value) {
  const [y, m, d] = String(value || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneWorkoutItem(item) {
  return {
    id: createId(),
    exerciseId: item?.exerciseId,
    name: item?.name,
    note: item?.note,
    sets: item?.sets,
    reps: item?.reps,
    weight: item?.weight
  };
}

function normalizeRecordsByDate(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = Object.create(null);
  const dateKeyRe = /^\d{4}-\d{2}-\d{2}$/;
  for (const [k, v] of Object.entries(raw)) {
    if (!dateKeyRe.test(k)) continue;
    if (!Array.isArray(v)) continue;
    out[k] = v
      .filter((it) => it && typeof it === "object")
      .map((it) => ({
        id: typeof it.id === "string" ? it.id : "",
        exerciseId: typeof it.exerciseId === "string" ? it.exerciseId : undefined,
        name: typeof it.name === "string" ? it.name : "",
        note: typeof it.note === "string" ? it.note : "",
        sets:
          typeof it.sets === "number"
            ? it.sets
            : it.sets == null
              ? null
              : Number(it.sets),
        reps:
          typeof it.reps === "number"
            ? it.reps
            : it.reps == null
              ? null
              : Number(it.reps),
        weight:
          typeof it.weight === "number"
            ? it.weight
            : it.weight == null
              ? null
              : Number(it.weight)
      }))
      .map((it) => ({
        ...it,
        sets: Number.isFinite(it.sets) ? it.sets : null,
        reps: Number.isFinite(it.reps) ? it.reps : null,
        weight: Number.isFinite(it.weight) ? it.weight : null
      }));
  }
  return out;
}

function loadWorkoutHistoryFromLocalStorage() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(WORKOUT_HISTORY_STORAGE_KEY);
    if (!raw) return {};
    return normalizeRecordsByDate(JSON.parse(raw));
  } catch {
    return {};
  }
}

function WorkoutListModal({
  open,
  title,
  items,
  routineItems,
  routineDayLabel,
  savingAdd,
  onClose,
  onAddItems,
  onUpdateItem,
  onDeleteItem
}) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftError, setDraftError] = useState("");
  const [addMode, setAddMode] = useState("choice");
  const [addDraft, setAddDraft] = useState({
    name: "",
    note: "",
    sets: "",
    reps: "",
    weight: ""
  });
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (!open) return;
    setEditingId(null);
    setDraft(null);
    setDraftError("");
    setAddMode("choice");
    setAddDraft({ name: "", note: "", sets: "", reps: "", weight: "" });
    setAddError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="운동 목록"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[color:var(--c-surface)] shadow-xl max-h-[calc(100vh-2rem)]">
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--c-border)] p-4">
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-[color:var(--c-text)]">
              {title}
            </p>
            <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
              해당 날짜에 수행한 운동 목록이에요.
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {items?.length ? (
            <ul className="divide-y divide-[color:var(--c-border)]">
              {items.map((it) => (
                <li key={it.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[color:var(--c-text)]">
                        {it.name}
                      </p>
                      {it.note ? (
                        <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
                          {it.note}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {editingId === it.id ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <input
                        value={draft?.sets ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...(prev || {}), sets: e.target.value }))
                        }
                        inputMode="numeric"
                        placeholder="세트"
                        className={[
                          "h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4",
                          "text-base font-semibold text-[color:var(--c-text)] shadow-sm outline-none transition duration-200",
                          "focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]"
                        ].join(" ")}
                      />
                      <input
                        value={draft?.reps ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...(prev || {}), reps: e.target.value }))
                        }
                        inputMode="numeric"
                        placeholder="횟수"
                        className={[
                          "h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4",
                          "text-base font-semibold text-[color:var(--c-text)] shadow-sm outline-none transition duration-200",
                          "focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]"
                        ].join(" ")}
                      />
                      <input
                        value={draft?.weight ?? ""}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...(prev || {}), weight: e.target.value }))
                        }
                        inputMode="numeric"
                        placeholder="무게(kg)"
                        className={[
                          "h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4",
                          "text-base font-semibold text-[color:var(--c-text)] shadow-sm outline-none transition duration-200",
                          "focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]"
                        ].join(" ")}
                      />
                      <div className="col-span-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const validation = validateWorkoutItemDraft({
                              id: it.id,
                              name: it.name,
                              note: it.note,
                              sets: draft?.sets,
                              reps: draft?.reps,
                              weight: draft?.weight
                            });
                            if (!validation.ok) {
                              setDraftError(validation.message);
                              return;
                            }
                            onUpdateItem?.(it.id, {
                              sets: validation.item.sets,
                              reps: validation.item.reps,
                              weight: validation.item.weight
                            });
                            setEditingId(null);
                            setDraft(null);
                            setDraftError("");
                          }}
                          className="h-11 flex-1 rounded-2xl bg-[linear-gradient(135deg,var(--c-primary),var(--c-primary-strong))] px-4 text-sm font-extrabold text-white shadow-sm transition active:scale-[0.98]"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setDraft(null);
                          }}
                          className="h-11 flex-1 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-extrabold text-[color:var(--c-text)] shadow-sm transition hover:bg-[color:var(--c-surface-2)] active:scale-[0.98]"
                        >
                          취소
                        </button>
                      </div>
                      {draftError ? (
                        <p className="col-span-3 text-xs font-semibold text-red-500">
                          {draftError}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded-2xl bg-[color:var(--c-surface-2)] px-3 py-2 text-xs font-extrabold text-[color:var(--c-text)]">
                        세트: {it.sets ?? "-"} · 횟수: {it.reps ?? "-"}
                        {it.weight == null || it.weight === ""
                          ? ""
                          : ` · 무게: ${it.weight}kg`}
                      </span>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(it.id);
                            setDraftError("");
                            setDraft({
                              sets: String(it.sets ?? ""),
                              reps: String(it.reps ?? ""),
                              weight: String(it.weight ?? "")
                            });
                          }}
                          className="h-10 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-3 text-xs font-extrabold text-[color:var(--c-text)] transition hover:bg-[color:var(--c-surface-2)] active:scale-[0.98]"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const ok =
                              typeof window === "undefined"
                                ? true
                                : window.confirm("정말 삭제할까요?");
                            if (!ok) return;
                            onDeleteItem?.(it.id);
                          }}
                          className="h-10 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 text-xs font-extrabold text-red-600 transition hover:bg-red-500/15 active:scale-[0.98] dark:text-red-300"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-3xl border border-dashed border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-8 text-center">
              <p className="text-sm font-semibold text-[color:var(--c-muted)]">
                이 날에는 운동 기록이 없어요.
              </p>
            </div>
          )}

          <div className="mt-4 rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[color:var(--c-text)]">
                  운동 추가
                </p>
                <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
                  빠진 운동 기록을 이 날짜에 추가해요.
                </p>
              </div>
              {addMode !== "choice" ? (
                <button
                  type="button"
                  onClick={() => {
                    setAddMode("choice");
                    setAddError("");
                  }}
                  className="h-9 shrink-0 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-3 text-xs font-extrabold text-[color:var(--c-text)]"
                >
                  뒤로
                </button>
              ) : null}
            </div>

            {addMode === "choice" ? (
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => setAddMode("manual")}
                  className="h-12 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-left text-sm font-extrabold text-[color:var(--c-text)] transition hover:bg-[color:var(--c-surface)]/80 active:scale-[0.98]"
                >
                  수동으로 추가
                </button>
                <button
                  type="button"
                  onClick={() => onAddItems?.((routineItems || []).map(cloneWorkoutItem))}
                  disabled={savingAdd || !(routineItems || []).length}
                  className="h-12 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-left text-sm font-extrabold text-[color:var(--c-text)] transition hover:bg-[color:var(--c-surface)]/80 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                  {routineDayLabel}요일 루틴 그대로 추가
                </button>
                {!(routineItems || []).length ? (
                  <p className="text-xs font-semibold text-[color:var(--c-muted-2)]">
                    이 요일에 등록된 루틴이 없어요.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                <input
                  value={addDraft.name}
                  onChange={(e) =>
                    setAddDraft((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="운동 이름"
                  className="h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-semibold text-[color:var(--c-text)] outline-none focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
                />
                <input
                  value={addDraft.note}
                  onChange={(e) =>
                    setAddDraft((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="메모"
                  className="h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-semibold text-[color:var(--c-text)] outline-none focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={addDraft.sets}
                    onChange={(e) =>
                      setAddDraft((prev) => ({ ...prev, sets: e.target.value }))
                    }
                    inputMode="numeric"
                    placeholder="세트"
                    className="h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-semibold text-[color:var(--c-text)] outline-none focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
                  />
                  <input
                    value={addDraft.reps}
                    onChange={(e) =>
                      setAddDraft((prev) => ({ ...prev, reps: e.target.value }))
                    }
                    inputMode="numeric"
                    placeholder="횟수"
                    className="h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-semibold text-[color:var(--c-text)] outline-none focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
                  />
                  <input
                    value={addDraft.weight}
                    onChange={(e) =>
                      setAddDraft((prev) => ({ ...prev, weight: e.target.value }))
                    }
                    inputMode="numeric"
                    placeholder="무게"
                    className="h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-semibold text-[color:var(--c-text)] outline-none focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
                  />
                </div>
                {addError ? (
                  <p className="text-xs font-semibold text-red-500">{addError}</p>
                ) : null}
                <button
                  type="button"
                  disabled={savingAdd}
                  onClick={() => {
                    const validation = validateWorkoutItemDraft({
                      id: createId(),
                      name: addDraft.name,
                      note: addDraft.note,
                      sets: addDraft.sets,
                      reps: addDraft.reps,
                      weight: addDraft.weight
                    });
                    if (!validation.ok) {
                      setAddError(validation.message);
                      return;
                    }
                    onAddItems?.([validation.item]);
                    setAddDraft({ name: "", note: "", sets: "", reps: "", weight: "" });
                    setAddError("");
                    setAddMode("choice");
                  }}
                  className="h-12 rounded-2xl bg-[linear-gradient(135deg,var(--c-primary),var(--c-primary-strong))] px-4 text-sm font-extrabold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
                >
                  {savingAdd ? "추가 중" : "기록에 추가"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <Button type="button" variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Stats() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const monthLabel = useMemo(() => formatMonth(month), [month]);
  const monthLabelKo = useMemo(() => formatMonthKorean(month), [month]);
  const today = useMemo(() => new Date(), []);
  const todayLabel = useMemo(() => formatDate(today), [today]);
  const todayMonthLabel = useMemo(() => formatMonth(today), [today]);
  const [restDays, setRestDays] = useState(() => loadRoutineRestDaysFromLocalStorage());
  const [routinesByDay, setRoutinesByDay] = useState(() => loadRoutinesFromLocalStorage());
  const [savingAdd, setSavingAdd] = useState(false);

  const [recordsByDate, setRecordsByDate] = useState(() => {
    return loadWorkoutHistoryFromLocalStorage();
  });

  const workoutByDate = useMemo(() => {
    const currentMonthLabel = formatMonth(month);
    if (currentMonthLabel > todayMonthLabel) return {};
    const monthOnly = Object.entries(recordsByDate || {}).reduce((acc, [k, v]) => {
      if (k.startsWith(currentMonthLabel) && Array.isArray(v)) acc[k] = v;
      return acc;
    }, {});
    return monthOnly;
  }, [month, recordsByDate, todayMonthLabel]);

  const restDateSet = useMemo(() => {
    const restDaySet = new Set(restDays);
    const total = daysInMonth(month);
    const dates = new Set();
    for (let day = 1; day <= total; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      if (!restDaySet.has(dayKeyFromDate(date))) continue;
      dates.add(formatDate(date));
    }
    return dates;
  }, [month, restDays]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let cancelled = false;
    async function fetchRestDays() {
      try {
        const data = await fetchRoutines();
        if (!cancelled && Array.isArray(data?.restDays)) {
          setRestDays(data.restDays);
        }
        if (!cancelled && data && typeof data === "object") {
          setRoutinesByDay(data);
        }
      } catch (e) {
        console.warn("[stats routines] fetch failed:", e);
      }
    }
    function syncRestDays() {
      setRestDays(loadRoutineRestDaysFromLocalStorage());
      setRoutinesByDay(loadRoutinesFromLocalStorage());
    }
    fetchRestDays();
    window.addEventListener("focus", syncRestDays);
    window.addEventListener("storage", syncRestDays);
    window.addEventListener("moduflow:routine-rest-days", syncRestDays);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", syncRestDays);
      window.removeEventListener("storage", syncRestDays);
      window.removeEventListener("moduflow:routine-rest-days", syncRestDays);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    function syncWorkoutHistory() {
      setRecordsByDate(loadWorkoutHistoryFromLocalStorage());
    }
    window.addEventListener("focus", syncWorkoutHistory);
    window.addEventListener("storage", syncWorkoutHistory);
    window.addEventListener(WORKOUT_HISTORY_EVENT, syncWorkoutHistory);
    return () => {
      window.removeEventListener("focus", syncWorkoutHistory);
      window.removeEventListener("storage", syncWorkoutHistory);
      window.removeEventListener(WORKOUT_HISTORY_EVENT, syncWorkoutHistory);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function syncWorkouts() {
      const from = `${monthLabel}-01`;
      const to = `${monthLabel}-${String(daysInMonth(month)).padStart(2, "0")}`;
      try {
        const workouts = await fetchWorkouts({ from, to });
        if (cancelled) return;
        setRecordsByDate((prev) => {
          const next = { ...(prev || {}) };
          for (const workout of workouts) {
            const date = String(workout?.date || "");
            if (!date.startsWith(monthLabel)) continue;
            const items = Array.isArray(workout?.items) ? workout.items : [];
            if (items.length) next[date] = items;
          }
          return normalizeRecordsByDate(next);
        });
      } catch (e) {
        console.warn("[stats workouts] fetch failed:", e);
      }
    }
    syncWorkouts();
    return () => {
      cancelled = true;
    };
  }, [month, monthLabel]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const out = Object.create(null);
      const dateKeyRe = /^\d{4}-\d{2}-\d{2}$/;
      for (const [k, v] of Object.entries(recordsByDate || {})) {
        if (!dateKeyRe.test(k)) continue;
        if (!Array.isArray(v)) continue;
        out[k] = v.filter((it) => it && typeof it === "object");
      }
      window.localStorage.setItem(WORKOUT_HISTORY_STORAGE_KEY, JSON.stringify(out));
    } catch {
      // ignore
    }
  }, [recordsByDate]);

  useEffect(() => {
    if (Object.keys(recordsByDate || {}).length) return;
    // Seed dummy history only up to today (no future dates)
    const currentMonthLabel = formatMonth(month);
    const canSeed = currentMonthLabel <= todayMonthLabel;
    if (!canSeed) return;
    const maxDay =
      currentMonthLabel === todayMonthLabel ? today.getDate() : daysInMonth(month);
    const baseY = month.getFullYear();
    const baseM = month.getMonth() + 1;
    const m = String(baseM).padStart(2, "0");
    const template = [
      {
        day: 2,
        items: [
          { id: "w1", name: "푸쉬업", note: "가슴 · 삼두", sets: 3, weight: 0 },
          { id: "w2", name: "플랭크", note: "코어", sets: 3, weight: 0 }
        ]
      },
      {
        day: 5,
        items: [{ id: "w3", name: "스쿼트", note: "하체", sets: 4, weight: 60 }]
      },
      {
        day: 12,
        items: [
          { id: "w4", name: "런지", note: "하체", sets: 3, weight: 10 },
          { id: "w5", name: "크런치", note: "복근", sets: 3, weight: 0 }
        ]
      }
    ];
    const seeded = template.reduce((acc, entry) => {
      if (entry.day > maxDay) return acc;
      const key = `${baseY}-${m}-${String(entry.day).padStart(2, "0")}`;
      acc[key] = entry.items;
      return acc;
    }, {});
    setRecordsByDate(seeded);
  }, []);

  const attendanceRate = useMemo(() => {
    const totalDays = daysInMonth(month);
    const countedDays = Math.max(0, totalDays - restDateSet.size);
    const attended = Object.keys(workoutByDate).filter(
      (d) => d.startsWith(monthLabel) && !restDateSet.has(d)
    ).length;
    return Math.round((attended / Math.max(1, countedDays)) * 100);
  }, [month, monthLabel, restDateSet, workoutByDate]);

  const [selectedDate, setSelectedDate] = useState(null);

  const postureAvg = 86;
  const postureTrend = [82, 84, 83, 86, 88, 87, 86];

  const calendarCells = useMemo(() => {
    const total = daysInMonth(month);
    const offset = startWeekday(month);
    return Array.from({ length: offset + total }).map((_, i) => {
      if (i < offset) return null;
      const day = i - offset + 1;
      return day;
    });
  }, [month]);

  const selectedItems = useMemo(() => {
    if (!selectedDate) return [];
    return workoutByDate[selectedDate] ?? [];
  }, [selectedDate, workoutByDate]);
  const selectedDateDayKey = useMemo(() => {
    const date = dateFromDateString(selectedDate);
    return date ? dayKeyFromDate(date) : "";
  }, [selectedDate]);
  const selectedRoutineItems = useMemo(() => {
    const list = routinesByDay?.[selectedDateDayKey];
    return Array.isArray(list) ? list : [];
  }, [routinesByDay, selectedDateDayKey]);

  useEffect(() => {
    setSelectedDate(null);
  }, [monthLabel]);

  function prevMonth() {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function nextMonth() {
    setMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return formatMonth(next) > todayMonthLabel ? prev : next;
    });
  }

  const nextDisabled = useMemo(() => monthLabel >= todayMonthLabel, [monthLabel, todayMonthLabel]);

  async function handleUpdateItem(itemId, patch) {
    if (!selectedDate) return;
    try {
      await updateWorkoutItem({ date: selectedDate, itemId, patch });
      setRecordsByDate((prev) => {
        const next = { ...(prev || {}) };
        const list = Array.isArray(next[selectedDate]) ? [...next[selectedDate]] : [];
        next[selectedDate] = list.map((it) => (it.id === itemId ? { ...it, ...patch } : it));
        return next;
      });
    } catch (e) {
      console.warn("[stats workout item] update failed:", e);
      window.alert(getApiErrorMessage(e, "운동 기록 수정에 실패했어요."));
    }
  }

  async function handleDeleteItem(itemId) {
    if (!selectedDate) return;
    try {
      await deleteWorkoutItem({ date: selectedDate, itemId });
      setRecordsByDate((prev) => {
        const next = { ...(prev || {}) };
        const list = Array.isArray(next[selectedDate]) ? next[selectedDate] : [];
        const filtered = list.filter((it) => it.id !== itemId);
        if (filtered.length) next[selectedDate] = filtered;
        else delete next[selectedDate];
        return next;
      });
    } catch (e) {
      console.warn("[stats workout item] delete failed:", e);
      window.alert(getApiErrorMessage(e, "운동 기록 삭제에 실패했어요."));
    }
  }

  async function handleAddItems(itemsToAdd) {
    if (!selectedDate) return;
    const safeItems = (Array.isArray(itemsToAdd) ? itemsToAdd : []).filter(Boolean);
    if (!safeItems.length) return;

    setSavingAdd(true);
    try {
      const nextItems = [...selectedItems, ...safeItems];
      await replaceWorkoutDay(selectedDate, nextItems);
      setRecordsByDate((prev) => ({
        ...(prev || {}),
        [selectedDate]: nextItems
      }));
    } catch (e) {
      console.warn("[stats workout item] add failed:", e);
      window.alert(getApiErrorMessage(e, "운동 기록 추가에 실패했어요."));
    } finally {
      setSavingAdd(false);
    }
  }

  return (
    <>
      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-[color:var(--c-muted)]">
            기록
          </p>
          <p className="mt-1 text-lg font-extrabold">한눈에 보기</p>
        </div>

        <Card className="p-0">
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[color:var(--c-muted)]">
                  출석률
                </p>
                <p className="mt-1 text-2xl font-extrabold">{attendanceRate}%</p>
                <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-text)] transition hover:bg-[color:var(--c-surface-2)] active:scale-[0.98]"
                  aria-label="이전 달"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <span className="min-w-[84px] text-center text-xs font-extrabold text-[color:var(--c-text)]">
                  {monthLabelKo}
                </span>
              <button
                type="button"
                onClick={nextMonth}
                className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-text)] transition hover:bg-[color:var(--c-surface-2)] active:scale-[0.98]"
                aria-label="다음 달"
                disabled={nextDisabled}
              >
                <ChevronRight
                  size={18}
                  aria-hidden="true"
                  className={nextDisabled ? "opacity-40" : undefined}
                />
              </button>
            </div>
          </div>
        </div>

          <div className="px-4 pb-4">
            <div className="rounded-3xl bg-[color:var(--c-surface-2)] p-3">
              <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-extrabold text-[color:var(--c-muted-2)]">
                {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarCells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />;
                  const dateStr = `${monthLabel}-${String(day).padStart(2, "0")}`;
                  const hasWorkout = Boolean(workoutByDate[dateStr]?.length);
                  const isRestDay = restDateSet.has(dateStr);
                  const isToday = dateStr === todayLabel;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        if (isRestDay) return;
                        setSelectedDate(dateStr);
                      }}
                      disabled={isRestDay}
                      className={[
                        "flex aspect-square flex-col items-center justify-center rounded-2xl text-xs font-extrabold transition active:scale-[0.98]",
                        hasWorkout
                          ? "bg-[color:var(--c-primary)] text-white hover:opacity-90"
                          : isRestDay
                            ? "border border-[color:var(--c-primary)]/20 bg-[color:var(--c-primary-soft)] text-[color:var(--c-primary)] hover:bg-[color:var(--c-primary-soft)]"
                          : "bg-[color:var(--c-surface)] text-[color:var(--c-muted-2)] hover:bg-[color:var(--c-surface)]/80",
                        isToday ? "ring-2 ring-[color:var(--c-purple)] ring-offset-2 ring-offset-[color:var(--c-surface-2)]" : "",
                        selectedDate === dateStr && !isRestDay ? "ring-2 ring-[color:var(--c-purple)] ring-offset-2 ring-offset-[color:var(--c-surface-2)]" : "",
                        isRestDay ? "cursor-not-allowed active:scale-100" : ""
                      ].join(" ")}
                      aria-label={`${dateStr}${isToday ? " 오늘" : ""}${hasWorkout ? " 운동 기록 있음" : ""}${isRestDay ? " 쉬는 날" : ""}`}
                    >
                      <span>{day}</span>
                      {isToday ? (
                        <span className="mt-0.5 text-[10px] leading-none">오늘</span>
                      ) : null}
                      {isRestDay ? (
                        <span className="mt-0.5 text-[10px] leading-none">휴</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--c-primary)]" />
                  운동 기록
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--c-primary-soft)] ring-1 ring-[color:var(--c-primary)]/30" />
                  쉬는 날
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white ring-1 ring-[color:var(--c-border)] dark:bg-[color:var(--c-surface)]" />
                  미기록
                </span>
                <span>(기준일: {todayLabel})</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-0">
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[color:var(--c-muted)]">
                  자세 정확도
                </p>
                <p className="mt-1 text-2xl font-extrabold">{postureAvg}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[color:var(--c-muted-2)]">
                  최근 7일
                </p>
                <p className="mt-1 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] px-3 py-2 text-xs font-extrabold text-[color:var(--c-text)] transition-[background-color,border-color] duration-200">
                  추이
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="rounded-3xl bg-[color:var(--c-surface-2)] p-3">
              <WeeklyWorkoutChart
                data={postureTrend}
                unit="%"
                datasetLabel="자세 정확도"
                suggestedMax={100}
              />
            </div>
          </div>
        </Card>

        <Button type="button" variant="secondary">
          자세 분석 데이터 연동 (추후)
        </Button>
      </section>

      <WorkoutListModal
        open={Boolean(selectedDate)}
        title={selectedDate ? `${selectedDate} 운동 목록` : "운동 목록"}
        items={selectedItems}
        routineItems={selectedRoutineItems}
        routineDayLabel={DAY_LABELS[selectedDateDayKey] || ""}
        savingAdd={savingAdd}
        onClose={() => setSelectedDate(null)}
        onAddItems={handleAddItems}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
      />
    </>
  );
}
