import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import MuscleTargetMap from "@/components/exercise/MuscleTargetMap";
import { ChevronRight, Dumbbell, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { validateWorkoutItemDraft } from "@/api/validation";
import { getApiErrorMessage } from "@/api/client";
import {
  cacheRoutinesToLocalStorage,
  fetchRoutines,
  saveRoutines
} from "@/api/routines";

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
    poseImage: "/exercises/poses/pushup.png",
    description:
      "양손을 어깨너비보다 조금 넓게 짚고 머리부터 발끝까지 일직선을 유지한 채 가슴이 바닥에 가까워질 때까지 내려갔다가 밀어 올려요.",
    tips: [
      "팔꿈치는 몸통에서 약 45도 방향으로 유지해요.",
      "허리가 꺾이지 않도록 복부와 엉덩이에 힘을 주세요."
    ],
    targetMuscle: "가슴 · 삼두 · 코어",
    targetMuscles: ["chest", "triceps", "shoulder"]
  },
  {
    id: "bench-press",
    name: "벤치프레스",
    category: "chest",
    difficulty: "중급",
    poseImage: "/exercises/poses/bench-press.png",
    description:
      "벤치에 등을 단단히 고정하고 바를 가슴 중앙까지 천천히 내린 뒤, 발로 바닥을 밀면서 수직으로 들어 올리는 가슴 운동이에요.",
    tips: [
      "손목이 뒤로 꺾이지 않게 바를 손바닥 아래쪽에 올려요.",
      "어깨를 뒤로 모으고 내린 상태를 동작 내내 유지해요."
    ],
    targetMuscle: "가슴 · 삼두 · 전면 어깨",
    targetMuscles: ["chest", "triceps", "shoulder"]
  },
  {
    id: "pullup",
    name: "풀업",
    category: "back",
    difficulty: "고급",
    poseImage: "/exercises/poses/pullup.png",
    description:
      "바를 어깨너비보다 넓게 잡고 견갑골을 먼저 아래로 당긴 다음, 가슴을 바 쪽으로 끌어올려 등과 팔을 강화해요.",
    tips: [
      "반동보다 등 근육의 수축에 집중해 천천히 움직여요.",
      "내려갈 때 팔을 충분히 펴되 어깨 힘은 완전히 풀지 않아요."
    ],
    targetMuscle: "광배 · 이두 · 코어",
    targetMuscles: ["back", "biceps"]
  },
  {
    id: "seated-row",
    name: "시티드 로우",
    category: "back",
    difficulty: "초급",
    poseImage: "/exercises/poses/seated-row.png",
    description:
      "상체를 세우고 손잡이를 배꼽 방향으로 당기며 견갑골을 모았다가, 등이 둥글게 말리지 않는 범위에서 팔을 천천히 펴요.",
    tips: [
      "손보다 팔꿈치를 뒤로 보낸다는 느낌으로 당겨요.",
      "상체를 과하게 앞뒤로 흔들지 않도록 코어를 고정해요."
    ],
    targetMuscle: "등(중부) · 이두",
    targetMuscles: ["back", "biceps"]
  },
  {
    id: "squat",
    name: "스쿼트",
    category: "legs",
    difficulty: "중급",
    poseImage: "/exercises/poses/squat.png",
    description:
      "발을 어깨너비로 벌리고 엉덩이를 뒤로 보내며 앉은 뒤, 발바닥 전체로 바닥을 밀어 일어나 하체와 코어를 강화해요.",
    tips: [
      "무릎은 발끝과 같은 방향으로 움직이게 유지해요.",
      "가슴이 과하게 숙여지거나 허리가 둥글게 말리지 않게 해요."
    ],
    targetMuscle: "대퇴사두 · 둔근 · 코어",
    targetMuscles: ["quad", "glute", "hamstring"]
  },
  {
    id: "lunge",
    name: "런지",
    category: "legs",
    difficulty: "초급",
    poseImage: "/exercises/poses/lunge.png",
    description:
      "한 발을 앞으로 내딛고 양쪽 무릎을 굽혀 몸을 수직으로 낮춘 뒤, 앞발로 바닥을 밀어 시작 자세로 돌아와요.",
    tips: [
      "앞 무릎이 안쪽으로 무너지지 않게 발끝 방향을 따라가요.",
      "보폭을 충분히 확보하고 상체를 곧게 세워요."
    ],
    targetMuscle: "둔근 · 햄스트링 · 대퇴사두",
    targetMuscles: ["quad", "glute", "hamstring"]
  },
  {
    id: "overhead-press",
    name: "오버헤드 프레스",
    category: "shoulders",
    difficulty: "중급",
    poseImage: "/exercises/poses/overhead-press.png",
    description:
      "복부에 힘을 주고 중량을 어깨 높이에서 머리 위로 밀어 올린 뒤, 팔꿈치가 손목 아래에 오도록 천천히 내려요.",
    tips: [
      "허리를 과하게 젖히지 않도록 갈비뼈와 골반을 고정해요.",
      "중량은 얼굴을 지나 몸의 중심선 위로 올려요."
    ],
    targetMuscle: "어깨 · 삼두",
    targetMuscles: ["shoulder", "triceps"]
  },
  {
    id: "lateral-raise",
    name: "사이드 레터럴 레이즈",
    category: "shoulders",
    difficulty: "초급",
    poseImage: "/exercises/poses/lateral-raise.png",
    description:
      "팔꿈치를 살짝 굽힌 상태에서 양팔을 옆으로 들어 어깨 높이 근처까지 올린 후, 긴장을 유지하며 천천히 내려요.",
    tips: [
      "손보다 팔꿈치가 먼저 올라간다는 느낌으로 움직여요.",
      "반동 없이 가벼운 중량으로 어깨 자극에 집중해요."
    ],
    targetMuscle: "측면 어깨",
    targetMuscles: ["shoulder"]
  },
  {
    id: "biceps-curl",
    name: "바이셉 컬",
    category: "arms",
    difficulty: "초급",
    poseImage: "/exercises/poses/biceps-curl.png",
    description:
      "팔꿈치를 몸통 옆에 고정하고 손바닥이 위를 향하도록 중량을 들어 올린 뒤, 이두의 긴장을 느끼며 천천히 내려요.",
    tips: [
      "팔꿈치가 앞뒤로 움직이지 않게 고정해요.",
      "손목을 꺾거나 상체 반동으로 중량을 들지 않아요."
    ],
    targetMuscle: "이두",
    targetMuscles: ["biceps"]
  },
  {
    id: "triceps-pushdown",
    name: "트라이셉스 푸시다운",
    category: "arms",
    difficulty: "초급",
    poseImage: "/exercises/poses/triceps-pushdown.png",
    description:
      "팔꿈치를 몸통 옆에 붙이고 케이블 손잡이를 아래로 밀어 팔을 편 뒤, 팔꿈치 위치를 유지하며 천천히 돌아와요.",
    tips: [
      "어깨가 아닌 팔꿈치 관절만 움직이도록 해요.",
      "아래 지점에서 팔을 펴고 삼두를 짧게 수축해요."
    ],
    targetMuscle: "삼두",
    targetMuscles: ["triceps"]
  },
  {
    id: "plank",
    name: "플랭크",
    category: "abs",
    difficulty: "초급",
    poseImage: "/exercises/poses/plank.png",
    description:
      "팔꿈치를 어깨 바로 아래에 두고 머리부터 발뒤꿈치까지 일직선을 만든 상태로 복부와 엉덩이에 힘을 주어 버텨요.",
    tips: [
      "엉덩이가 올라가거나 허리가 아래로 처지지 않게 해요.",
      "숨을 참지 말고 짧고 일정하게 호흡해요."
    ],
    targetMuscle: "코어",
    targetMuscles: ["abs", "shoulder"]
  },
  {
    id: "crunch",
    name: "크런치",
    category: "abs",
    difficulty: "초급",
    poseImage: "/exercises/poses/crunch.png",
    description:
      "무릎을 세우고 누운 상태에서 허리를 바닥에 붙인 채, 갈비뼈를 골반 쪽으로 당기며 어깨뼈가 들릴 정도만 상체를 말아 올려요.",
    tips: [
      "목을 손으로 당기지 말고 시선은 천장을 향해요.",
      "크게 일어나기보다 복근을 짧게 수축하는 데 집중해요."
    ],
    targetMuscle: "복근",
    targetMuscles: ["abs"]
  }
];

function dayKeyFromDate(date) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[date.getDay()];
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function DifficultyPill({ difficulty }) {
  const style =
    difficulty === "고급"
      ? "bg-red-50 text-[color:var(--c-danger)] border-red-100 dark:bg-red-500/10 dark:border-red-500/25"
      : difficulty === "중급"
        ? "bg-[color:var(--c-purple-soft)] text-[color:var(--c-purple)] border-[color:var(--c-purple)]/20"
        : "bg-[color:var(--c-primary-soft)] text-[color:var(--c-primary)] border-[color:var(--c-primary)]/20";

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

function getExerciseIconClass(exercise) {
  if (exercise.id === "bench-press") {
    return "border-[color:var(--c-purple)]/20 bg-[color:var(--c-purple-soft)] text-[color:var(--c-purple)]";
  }
  if (exercise.id === "pullup" || exercise.difficulty === "고급") {
    return "border-red-100 bg-red-50 text-[color:var(--c-danger)] dark:border-red-500/25 dark:bg-red-500/10";
  }
  return "border-[color:var(--c-primary)]/20 bg-[color:var(--c-primary-soft)] text-[color:var(--c-primary)]";
}

function ExerciseModal({ open, exercise, onClose, onRequestAdd, addDisabled }) {
  const [poseImageFailed, setPoseImageFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    setPoseImageFailed(false);
  }, [exercise?.id, open]);

  if (!open || !exercise) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${exercise.name} 상세`}
      className="fixed -top-24 bottom-[calc(72px+env(safe-area-inset-bottom))] inset-x-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-4 pt-28"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[color:var(--c-surface)] shadow-xl max-h-[calc(100dvh-72px-env(safe-area-inset-bottom)-2rem)]">
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
          {exercise.poseImage && !poseImageFailed ? (
            <div className="overflow-hidden rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)]">
              <div className="aspect-[4/3] w-full">
                <img
                  src={exercise.poseImage}
                  alt={`${exercise.name} 자세`}
                  className="h-full w-full object-contain"
                  onError={() => setPoseImageFailed(true)}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-[color:var(--c-border)] bg-gradient-to-br from-[color:var(--c-surface-2)] to-[color:var(--c-surface)] p-6">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)]">
                  <Dumbbell size={20} aria-hidden="true" />
                </div>
                <DifficultyPill difficulty={exercise.difficulty} />
              </div>
              <p className="mt-4 text-sm font-semibold text-[color:var(--c-muted)]">
                동작 예시 이미지는 추후 업데이트 예정이에요.
              </p>
            </div>
          )}

          <MuscleTargetMap
            exerciseName={exercise.name}
            targetMuscles={exercise.targetMuscles}
          />

          <Card className="space-y-2">
            <p className="text-sm font-extrabold text-[color:var(--c-text)]">
              설명
            </p>
            <p className="text-sm font-semibold leading-relaxed text-[color:var(--c-muted)]">
              {exercise.description}
            </p>
          </Card>

          <Card className="space-y-2">
            <p className="text-sm font-extrabold text-[color:var(--c-text)]">
              운동 팁
            </p>
            <ul className="space-y-2 text-sm font-semibold leading-relaxed text-[color:var(--c-muted)]">
              {exercise.tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="text-[color:var(--c-primary)]" aria-hidden="true">
                    •
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
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
  saving,
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
      className="fixed -top-24 bottom-[calc(72px+env(safe-area-inset-bottom))] inset-x-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-4 pt-28"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[color:var(--c-surface)] shadow-xl max-h-[calc(100dvh-72px-env(safe-area-inset-bottom)-2rem)]">
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
                        ? "border-[color:var(--c-primary)] bg-[color:var(--c-primary)] text-white"
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
              disabled={saving}
              onClick={() =>
                onConfirm({
                  dayKey,
                  sets,
                  reps,
                  weight
                })
              }
            >
              {saving ? "추가 중..." : "추가하기"}
            </Button>
            <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>
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
  const [savingRoutine, setSavingRoutine] = useState(false);
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

  function openAddModal() {
    if (!modalExercise) return;
    setAddModalOpen(true);
  }

  async function addToRoutine({ dayKey, sets, reps, weight }) {
    if (!modalExercise || savingRoutine) return;
    const validation = validateWorkoutItemDraft({
      name: modalExercise.name,
      exerciseId: modalExercise.id,
      sets,
      reps,
      weight
    });
    if (!validation.ok) {
      setToast(validation.message);
      return;
    }
    setSavingRoutine(true);
    let latestRoutines = null;
    try {
      const stored = await fetchRoutines();
      latestRoutines = stored;
      const list = Array.isArray(stored?.[dayKey]) ? stored[dayKey] : [];
      const duplicated = list.some(
        (it) => it?.exerciseId === modalExercise.id || it?.name === modalExercise.name
      );
      if (duplicated) {
        setToast("이미 루틴에 추가된 운동이에요.");
        return;
      }
      const next = { ...(stored || {}) };
      next[dayKey] = [
        ...list,
        {
          id: createId(),
          name: validation.item.name,
          sets: validation.item.sets,
          reps: validation.item.reps,
          weight: validation.item.weight,
          exerciseId: validation.item.exerciseId
        }
      ];
      cacheRoutinesToLocalStorage(next);
      await saveRoutines(next);
      setToast("루틴에 추가되었습니다.");
      setAddModalOpen(false);
      setModalExerciseId(null);
    } catch (e) {
      if (latestRoutines) cacheRoutinesToLocalStorage(latestRoutines);
      setToast(getApiErrorMessage(e, "루틴 추가에 실패했어요."));
    } finally {
      setSavingRoutine(false);
    }
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
                      ? "border-[color:var(--c-primary)] bg-[color:var(--c-primary)] text-white"
                      : "border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-text)] hover:bg-[color:var(--c-primary-soft)]"
                  ].join(" ")}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="flex items-center gap-2 rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 py-3 shadow-sm transition focus-within:border-[color:var(--c-primary)] focus-within:ring-2 focus-within:ring-[color:var(--c-focus-ring)]">
          <Search size={18} className="text-[color:var(--c-primary)]" aria-hidden="true" />
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
                <Card className="p-0 transition hover:border-[color:var(--c-border-strong)] hover:bg-[color:var(--c-primary-soft)] active:bg-[color:var(--c-primary-soft)]">
                  <div className="flex items-center gap-4 p-4">
                    <div className={`grid h-14 w-14 place-items-center rounded-3xl border ${getExerciseIconClass(ex)}`}>
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
                    <ChevronRight
                      size={20}
                      className="shrink-0 text-[color:var(--c-muted-2)]"
                      aria-hidden="true"
                    />
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
        addDisabled={false}
      />

      <AddToRoutineModal
        open={addModalOpen}
        exercise={modalExercise}
        initialDayKey={dayKeyFromDate(new Date())}
        saving={savingRoutine}
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
