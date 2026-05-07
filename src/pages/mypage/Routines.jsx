import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

const STORAGE_KEY = "moduflow:routines-by-day:v1";
const STORAGE_SELECTED_DAY_KEY = "moduflow:routines-selected-day:v1";
const DAYS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" }
];

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadSelectedDay(fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_SELECTED_DAY_KEY);
    if (!raw) return fallback;
    return DAYS.some((d) => d.key === raw) ? raw : fallback;
  } catch {
    return fallback;
  }
}

function loadRoutinesByDay() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function dayKeyFromDate(date) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[date.getDay()];
}

function DaySelectionBar({ value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {DAYS.map((d) => {
        const active = d.key === value;
        return (
          <button
            key={d.key}
            type="button"
            onClick={() => onChange(d.key)}
            aria-pressed={active}
            className={[
              "shrink-0 rounded-full border px-3 py-2 text-sm font-extrabold transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--c-surface)]",
              active
                ? "border-black bg-black text-white dark:border-neutral-200 dark:bg-neutral-100 dark:text-black"
                : "border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-muted)] hover:bg-[color:var(--c-surface-2)] hover:text-[color:var(--c-text)]"
            ].join(" ")}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

function IconButton({ label, onClick, children, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
      : "text-[color:var(--c-muted-2)] hover:text-[color:var(--c-text)]";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "grid h-10 w-10 place-items-center rounded-2xl transition hover:bg-[color:var(--c-surface-2)] active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--c-surface)]",
        toneClass
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function Routines() {
  const todayKey = useMemo(() => dayKeyFromDate(new Date()), []);
  const [selectedDay, setSelectedDay] = useState(() =>
    loadSelectedDay(todayKey)
  );
  const [routinesByDay, setRoutinesByDay] = useState(() => {
    const stored = loadRoutinesByDay();
    if (Object.keys(stored).length > 0) return stored;
    return {
      mon: [
        { id: createId(), name: "Bench Press", sets: 4, weight: 60 },
        { id: createId(), name: "Incline DB Press", sets: 3, weight: 24 }
      ],
      wed: [{ id: createId(), name: "Pull Up", sets: 4, weight: 0 }],
      fri: [{ id: createId(), name: "Squat", sets: 5, weight: 80 }]
    };
  });
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const routineForSelectedDay = routinesByDay?.[selectedDay] || [];

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_SELECTED_DAY_KEY, selectedDay);
    } catch {
      // ignore
    }
  }, [selectedDay]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(routinesByDay));
    } catch {
      // ignore
    }
  }, [routinesByDay]);

  function startEdit(item) {
    setEditingId(item.id);
    setDraft({
      name: item.name ?? "",
      sets: String(item.sets ?? ""),
      reps: String(item.reps ?? ""),
      weight: String(item.weight ?? "")
    });
  }

  function finishEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    if (!editingId || !draft) return;
    const nextSets = Number(draft.sets);
    const nextReps = Number(draft.reps);
    const nextWeight = Number(draft.weight);
    setRoutinesByDay((prev) => {
      const next = { ...(prev || {}) };
      const list = Array.isArray(next[selectedDay]) ? [...next[selectedDay]] : [];
      next[selectedDay] = list.map((it) =>
        it.id === editingId
          ? {
            ...it,
            name: draft.name.trim(),
            sets: draft.sets === "" ? null : Number.isFinite(nextSets) ? nextSets : null,
            reps: draft.reps === "" ? null : Number.isFinite(nextReps) ? nextReps : null,
            weight:
              draft.weight === "" ? null : Number.isFinite(nextWeight) ? nextWeight : null,
            isNew: false
          }
          : it
      );
      return next;
    });
    finishEdit();
  }

  function cancelEdit() {
    if (!editingId) return finishEdit();
    setRoutinesByDay((prev) => {
      const next = { ...(prev || {}) };
      const list = Array.isArray(next[selectedDay]) ? next[selectedDay] : [];
      const target = list.find((it) => it.id === editingId);
      if (!target?.isNew) return next;
      next[selectedDay] = list.filter((it) => it.id !== editingId);
      return next;
    });
    finishEdit();
  }

  function deleteItem(id) {
    if (typeof window !== "undefined") {
      const ok = window.confirm("정말 삭제할까요?");
      if (!ok) return;
    }
    setRoutinesByDay((prev) => {
      const next = { ...(prev || {}) };
      const list = Array.isArray(next[selectedDay]) ? next[selectedDay] : [];
      next[selectedDay] = list.filter((it) => it.id !== id);
      return next;
    });
    if (editingId === id) finishEdit();
  }

  function addRoutine() {
    const newItem = {
      id: createId(),
      name: "",
      sets: null,
      reps: null,
      weight: null,
      isNew: true
    };
    setRoutinesByDay((prev) => {
      const next = { ...(prev || {}) };
      const list = Array.isArray(next[selectedDay]) ? [...next[selectedDay]] : [];
      next[selectedDay] = [...list, newItem];
      return next;
    });
    startEdit(newItem);
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">
          루틴 설정
        </p>
        <p className="mt-1 text-lg font-extrabold">내 루틴</p>
      </div>

      <Card className="space-y-4">
        <div>
          <p className="text-sm font-extrabold text-[color:var(--c-text)]">
            요일 선택
          </p>
          <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
            요일을 선택하면 해당 요일 루틴만 보여요.
          </p>
        </div>

        <DaySelectionBar value={selectedDay} onChange={setSelectedDay} />
      </Card>

      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-[color:var(--c-text)]">
              루틴 목록
            </p>
            <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
              {DAYS.find((d) => d.key === selectedDay)?.label || ""} · 운동 / 세트 /
              횟수 / 무게
            </p>
          </div>
          {routineForSelectedDay.length && !editingId ? (
            <div className="shrink-0">
              <Button
                type="button"
                variant="secondary"
                className="w-auto px-4 py-3 text-sm"
                onClick={addRoutine}
              >
                + 추가
              </Button>
            </div>
          ) : null}
        </div>

        {routineForSelectedDay.length ? (
          <ul className="space-y-3">
            {routineForSelectedDay.map((it) => {
              const editing = it.id === editingId;
              return (
                <li key={it.id}>
                  <Card className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {editing ? (
                        <div className="space-y-2">
                          <input
                            value={draft?.name ?? ""}
                            onChange={(e) =>
                              setDraft((prev) => ({ ...(prev || {}), name: e.target.value }))
                            }
                            placeholder="운동 이름"
                            className={[
                              "h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4",
                              "text-base font-semibold text-[color:var(--c-text)] shadow-sm outline-none transition duration-200",
                              "focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]"
                            ].join(" ")}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              value={draft?.sets ?? ""}
                              onChange={(e) =>
                                setDraft((prev) => ({ ...(prev || {}), sets: e.target.value }))
                              }
                              inputMode="numeric"
                              className={[
                                "h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4",
                                "text-base font-semibold text-[color:var(--c-text)] shadow-sm outline-none transition duration-200",
                                "focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]"
                              ].join(" ")}
                              placeholder="세트"
                            />
                            <input
                              value={draft?.reps ?? ""}
                              onChange={(e) =>
                                setDraft((prev) => ({ ...(prev || {}), reps: e.target.value }))
                              }
                              inputMode="numeric"
                              className={[
                                "h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4",
                                "text-base font-semibold text-[color:var(--c-text)] shadow-sm outline-none transition duration-200",
                                "focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]"
                              ].join(" ")}
                              placeholder="횟수"
                            />
                            <input
                              value={draft?.weight ?? ""}
                              onChange={(e) =>
                                setDraft((prev) => ({ ...(prev || {}), weight: e.target.value }))
                              }
                              inputMode="numeric"
                              className={[
                                "h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4",
                                "text-base font-semibold text-[color:var(--c-text)] shadow-sm outline-none transition duration-200",
                                "focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]"
                              ].join(" ")}
                              placeholder="무게"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="truncate text-sm font-extrabold text-[color:var(--c-text)]">
                            {it.name ? (
                              it.name
                            ) : (
                              <span className="font-semibold text-[color:var(--c-muted-2)]">
                                운동 이름
                              </span>
                            )}
                          </p>
                          <p className="mt-1 truncate text-xs font-semibold text-[color:var(--c-muted-2)]">
                            세트: {it.sets ?? "-"} · 횟수: {it.reps ?? "-"} · 무게:{" "}
                            {it.weight ?? "-"}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {editing ? (
                        <>
                          <IconButton label="저장" onClick={saveEdit}>
                            <Check size={18} aria-hidden="true" />
                          </IconButton>
                          <IconButton label="취소" onClick={cancelEdit}>
                            <X size={18} aria-hidden="true" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton label="편집" onClick={() => startEdit(it)}>
                            <Pencil size={18} aria-hidden="true" />
                          </IconButton>
                          <IconButton
                            label="삭제"
                            tone="danger"
                            onClick={() => deleteItem(it.id)}
                          >
                            <Trash2 size={18} aria-hidden="true" />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-8 text-center">
            <p className="text-sm font-semibold text-[color:var(--c-muted)]">
            </p>
            <div className="mx-auto mt-4 w-full max-w-xs">
              <Button type="button" variant="secondary" onClick={addRoutine}>
                <span className="inline-flex items-center justify-center gap-2">
                  <Plus size={18} aria-hidden="true" />
                  루틴 추가
                </span>
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setRoutinesByDay((prev) => {
                const next = { ...(prev || {}) };
                delete next[selectedDay];
                return next;
              });
              cancelEdit();
            }}
          >
            해당 요일 초기화
          </Button>
          <Button type="button" onClick={() => setSelectedDay(todayKey)}>
            오늘로 이동
          </Button>
        </div>
      </Card>
    </section>
  );
}
