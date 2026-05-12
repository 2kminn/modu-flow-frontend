import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Dumbbell, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ROUTINE_STORAGE_KEY = "moduflow:routines-by-day:v1";

const CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "chest", label: "가슴" },
  { key: "back", label: "등" },
  { key: "legs", label: "하체" },
  { key: "shoulders", label: "어깨" },
  { key: "arms", label: "팔" },
  { key: "abs", label: "복근" }
];

const DAYS = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" }
];

const EXERCISES = [
  {
    id: "pushup",
    name: "푸쉬업",
    category: "chest",
    difficulty: "초급",
    description: "가슴과 삼두를 함께 강화하는 대표적인 맨몸 운동이에요.",
    targetMuscle: "가슴 · 삼두 · 코어"
  },
  {
    id: "bench-press",
    name: "벤치프레스",
    category: "chest",
    difficulty: "중급",
    description: "가슴 근육을 집중적으로 자극하는 대표적인 웨이트 운동이에요.",
    targetMuscle: "가슴 · 삼두 · 전면 어깨"
  },
  {
    id: "pullup",
    name: "풀업",
    category: "back",
    difficulty: "고급",
    description: "상체 당기는 힘을 키우는 고전적인 운동이에요.",
    targetMuscle: "광배 · 이두 · 코어"
  },
  {
    id: "seated-row",
    name: "시티드 로우",
    category: "back",
    difficulty: "초급",
    description: "등 중앙을 안정적으로 강화할 수 있어요.",
    targetMuscle: "등(중부) · 이두"
  },
  {
    id: "squat",
    name: "스쿼트",
    category: "legs",
    difficulty: "중급",
    description: "하체와 코어를 함께 강화하는 전신 운동이에요.",
    targetMuscle: "대퇴사두 · 둔근 · 코어"
  },
  {
    id: "lunge",
    name: "런지",
    category: "legs",
    difficulty: "초급",
    description: "균형과 하체 근력을 함께 잡을 수 있어요.",
    targetMuscle: "둔근 · 햄스트링 · 대퇴사두"
  },
  {
    id: "overhead-press",
    name: "오버헤드 프레스",
    category: "shoulders",
    difficulty: "중급",
    description: "어깨 전반을 키우는 기본 프레스 동작이에요.",
    targetMuscle: "어깨 · 삼두"
  },
  {
    id: "lateral-raise",
    name: "사이드 레터럴 레이즈",
    category: "shoulders",
    difficulty: "초급",
    description: "측면 어깨(삼각근 측면)를 집중적으로 자극해요.",
    targetMuscle: "측면 어깨"
  },
  {
    id: "biceps-curl",
    name: "바이셉 컬",
    category: "arms",
    difficulty: "초급",
    description: "이두근을 단순하고 확실하게 자극할 수 있어요.",
    targetMuscle: "이두"
  },
  {
    id: "triceps-pushdown",
    name: "트라이셉스 푸시다운",
    category: "arms",
    difficulty: "초급",
    description: "삼두를 안전하게 자극하기 좋은 케이블 운동이에요.",
    targetMuscle: "삼두"
  },
  {
    id: "plank",
    name: "플랭크",
    category: "abs",
    difficulty: "초급",
    description: "코어 안정성을 길러주는 정적 운동이에요.",
    targetMuscle: "코어"
  },
  {
    id: "crunch",
    name: "크런치",
    category: "abs",
    difficulty: "초급",
    description: "복근(상복부)을 집중적으로 수축해요.",
    targetMuscle: "복근"
  }
];

function dayKeyFromDate(date) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[date.getDay()];
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadRoutinesByDay() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROUTINE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
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

function saveRoutinesByDay(next) {
  if (typeof window === "undefined") return;
  try {
    const dayKeys = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
    const out = Object.create(null);
    if (next && typeof next === "object") {
      for (const [dayKey, list] of Object.entries(next)) {
        if (!dayKeys.has(dayKey)) continue;
        if (!Array.isArray(list)) continue;
        out[dayKey] = list.filter((it) => it && typeof it === "object");
      }
    }
    window.localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(out));
  } catch {
    // ignore
  }
}

function DifficultyPill({ difficulty }) {
  const style =
    difficulty === "고급"
      ? "bg-[color:var(--c-level-high)]/15 text-[color:var(--c-level-high)] border-[color:var(--c-level-high)]/30"
      : difficulty === "중급"
        ? "bg-[color:var(--c-level-mid)]/15 text-[color:var(--c-level-mid)] border-[color:var(--c-level-mid)]/30"
        : "bg-[color:var(--c-level-low)]/15 text-[color:var(--c-level-low)] border-[color:var(--c-level-low)]/30";

  return (
    <span
      className={[
        "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-extrabold",
        style
      ].join(" ")}
    >
      {difficulty}
    </span>
  );
}

function ExerciseModal({ open, exercise, onClose, onRequestAdd, addDisabled }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !exercise) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${exercise.name} 상세`}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[color:var(--c-surface)] shadow-xl max-h-[calc(100vh-2rem)]">
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--c-border)] p-4">
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-[color:var(--c-text)]">
              {exercise.name}
            </p>
            <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
              자극 부위 · {exercise.targetMuscle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-text)] transition hover:bg-[color:var(--c-surface-2)]"
            aria-label="닫기"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="rounded-3xl border border-[color:var(--c-border)] bg-gradient-to-br from-[color:var(--c-surface-2)] to-[color:var(--c-surface)] p-6">
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)]">
                <Dumbbell size={20} aria-hidden="true" />
              </div>
              <DifficultyPill difficulty={exercise.difficulty} />
            </div>
            <p className="mt-4 text-sm font-semibold text-[color:var(--c-muted)]">
              동작 예시(이미지/영상)는 추후 업데이트 예정이에요.
            </p>
          </div>

          <Card className="space-y-2">
            <p className="text-sm font-extrabold text-[color:var(--c-text)]">
              설명
            </p>
            <p className="text-sm font-semibold leading-relaxed text-[color:var(--c-muted)]">
              {exercise.description}
            </p>
          </Card>
        </div>

        <div className="shrink-0 border-t border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="grid gap-2">
            <Button type="button" onClick={onRequestAdd} disabled={addDisabled}>
              {addDisabled ? "이미 루틴에 있어요" : "루틴에 추가"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddToRoutineModal({
  open,
  exercise,
  initialDayKey,
  onClose,
  onConfirm
}) {
  const [dayKey, setDayKey] = useState(initialDayKey);
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  useEffect(() => {
    if (!open) return;
    setDayKey(initialDayKey);
    setSets("");
    setReps("");
    setWeight("");
  }, [open, initialDayKey]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !exercise) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="루틴 추가 설정"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[color:var(--c-surface)] shadow-xl max-h-[calc(100vh-2rem)]">
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--c-border)] p-4">
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-[color:var(--c-text)]">
              루틴에 추가
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-[color:var(--c-muted-2)]">
              {exercise.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-text)] transition hover:bg-[color:var(--c-surface-2)]"
            aria-label="닫기"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <Card className="space-y-3">
            <p className="text-sm font-extrabold text-[color:var(--c-text)]">
              요일 선택
            </p>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d) => {
                const active = d.key === dayKey;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDayKey(d.key)}
                    className={[
                      "h-10 rounded-2xl border text-xs font-extrabold transition",
                      active
                        ? "border-black bg-black text-white dark:border-neutral-200 dark:bg-neutral-100 dark:text-black"
                        : "border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-text)] hover:bg-[color:var(--c-surface-2)]"
                    ].join(" ")}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-3">
            <p className="text-sm font-extrabold text-[color:var(--c-text)]">
              세트/횟수/무게
            </p>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                inputMode="numeric"
                placeholder="세트"
                className={[
                  "h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4",
                  "text-base font-semibold text-[color:var(--c-text)] shadow-sm outline-none transition duration-200",
                  "focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]"
                ].join(" ")}
              />
              <input
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                inputMode="numeric"
                placeholder="횟수"
                className={[
                  "h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4",
                  "text-base font-semibold text-[color:var(--c-text)] shadow-sm outline-none transition duration-200",
                  "focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]"
                ].join(" ")}
              />
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                inputMode="numeric"
                placeholder="무게"
                className={[
                  "h-11 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4",
                  "text-base font-semibold text-[color:var(--c-text)] shadow-sm outline-none transition duration-200",
                  "focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]"
                ].join(" ")}
              />
            </div>
          </Card>

          <div className="grid gap-2">
            <Button
              type="button"
              onClick={() =>
                onConfirm({
                  dayKey,
                  sets,
                  reps,
                  weight
                })
              }
            >
              추가하기
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Workout() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [listVisible, setListVisible] = useState(true);
  const [modalExerciseId, setModalExerciseId] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setListVisible(false);
    const raf = window.requestAnimationFrame(() => setListVisible(true));
    return () => window.cancelAnimationFrame(raf);
  }, [selectedCategory]);

  const exercisesForCategory = useMemo(() => {
    const normalizedQuery = query.trim();
    return EXERCISES.filter((ex) => {
      const categoryMatch = selectedCategory === "all" || ex.category === selectedCategory;
      if (!categoryMatch) return false;
      if (!normalizedQuery) return true;
      return ex.name.includes(normalizedQuery);
    });
  }, [query, selectedCategory]);

  const modalExercise = useMemo(
    () => EXERCISES.find((ex) => ex.id === modalExerciseId) || null,
    [modalExerciseId]
  );

  const addDisabled = useMemo(() => {
    if (!modalExercise) return false;
    const stored = loadRoutinesByDay();
    const todayKey = dayKeyFromDate(new Date());
    const list = Array.isArray(stored?.[todayKey]) ? stored[todayKey] : [];
    return list.some((it) => it?.exerciseId === modalExercise.id || it?.name === modalExercise.name);
  }, [modalExercise]);

  function openAddModal() {
    if (!modalExercise) return;
    setAddModalOpen(true);
  }

  function addToRoutine({ dayKey, sets, reps, weight }) {
    if (!modalExercise) return;
    const stored = loadRoutinesByDay();
    const list = Array.isArray(stored?.[dayKey]) ? stored[dayKey] : [];
    const duplicated = list.some(
      (it) => it?.exerciseId === modalExercise.id || it?.name === modalExercise.name
    );
    if (duplicated) {
      setToast("이미 루틴에 추가된 운동이에요.");
      return;
    }
    const nextSets = Number(sets);
    const nextReps = Number(reps);
    const nextWeight = Number(weight);
    const next = { ...(stored || {}) };
    next[dayKey] = [
      ...list,
      {
        id: createId(),
        name: modalExercise.name,
        sets: sets === "" ? null : Number.isFinite(nextSets) ? nextSets : null,
        reps: reps === "" ? null : Number.isFinite(nextReps) ? nextReps : null,
        weight: weight === "" ? null : Number.isFinite(nextWeight) ? nextWeight : null,
        exerciseId: modalExercise.id
      }
    ];
    saveRoutinesByDay(next);
    setToast("루틴에 추가되었습니다.");
    setAddModalOpen(false);
    setModalExerciseId(null);
  }

  return (
    <>
      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-[color:var(--c-muted)]">
            운동
          </p>
          <p className="mt-1 text-lg font-extrabold">
            어떤 운동을 해볼까요?
          </p>
          <p className="mt-2 text-sm text-[color:var(--c-muted)]">
            카테고리를 선택하고 운동을 눌러 상세 정보를 확인해요.
          </p>
        </div>

        <Card className="p-0">
          <div className="flex gap-2 overflow-x-auto p-3">
            {CATEGORIES.map((cat) => {
              const active = cat.key === selectedCategory;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={[
                    "shrink-0 rounded-2xl border px-4 py-2 text-sm font-extrabold transition",
                    active
                      ? "border-black bg-black text-white dark:border-neutral-200 dark:bg-neutral-100 dark:text-black"
                      : "border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-text)] hover:bg-[color:var(--c-surface-2)]"
                  ].join(" ")}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="flex items-center gap-2 rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 py-3 shadow-sm">
          <Search size={18} className="text-[color:var(--c-muted-2)]" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="운동 이름 검색"
            className="h-8 w-full bg-transparent text-sm font-semibold text-[color:var(--c-text)] outline-none placeholder:text-[color:var(--c-muted-2)]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="grid h-8 w-8 place-items-center rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-text)] transition hover:bg-[color:var(--c-surface-2)]"
              aria-label="검색어 지우기"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div
          className={[
            "space-y-3 transition-opacity duration-200",
            listVisible ? "opacity-100" : "opacity-0"
          ].join(" ")}
        >
          {exercisesForCategory.length ? (
            exercisesForCategory.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setModalExerciseId(ex.id)}
                className="block w-full text-left"
              >
                <Card className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <div className="grid h-14 w-14 place-items-center rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] text-[color:var(--c-text)]">
                      <Dumbbell size={22} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-base font-extrabold">
                          {ex.name}
                        </p>
                        <DifficultyPill difficulty={ex.difficulty} />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-[color:var(--c-muted)]">
                        {ex.targetMuscle}
                      </p>
                    </div>
                  </div>
                </Card>
              </button>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-8 text-center">
              <p className="text-sm font-semibold text-[color:var(--c-muted)]">
                검색 결과가 없어요.
              </p>
              <p className="mt-2 text-xs font-semibold text-[color:var(--c-muted-2)]">
                다른 키워드로 검색해 보세요.
              </p>
            </div>
          )}
        </div>
      </section>

      <ExerciseModal
        open={Boolean(modalExerciseId)}
        exercise={modalExercise}
        onClose={() => setModalExerciseId(null)}
        onRequestAdd={openAddModal}
        addDisabled={addDisabled}
      />

      <AddToRoutineModal
        open={addModalOpen}
        exercise={modalExercise}
        initialDayKey={dayKeyFromDate(new Date())}
        onClose={() => setAddModalOpen(false)}
        onConfirm={addToRoutine}
      />

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 px-4">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 py-3 text-center text-sm font-extrabold text-[color:var(--c-text)] shadow-lg">
            {toast}
          </div>
        </div>
      ) : null}
    </>
  );
}
