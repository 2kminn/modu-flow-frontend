import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const ROUTINE_STORAGE_KEY = "moduflow:routines-by-day:v1";
const AUTO_ATTENDANCE_STORAGE_KEY = "moduflow:auto-attendance:v1";
const DAY_LABELS = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일"
};
const EXERCISE_NAME_TO_ID = {
  squat: "squat",
  "스쿼트": "squat",
  pushup: "pushup",
  "푸쉬업": "pushup",
  "푸시업": "pushup",
  lunge: "lunge",
  "런지": "lunge",
  plank: "plank",
  "플랭크": "plank"
};

function dayKeyFromDate(date) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[date.getDay()];
}

function loadRoutinesByDay() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROUTINE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function resolveExerciseId(name) {
  if (typeof name !== "string") return null;
  return EXERCISE_NAME_TO_ID[name.trim().toLowerCase()] || null;
}

function CongestionPill({ level, title }) {
  const map = {
    low: {
      label: "여유",
      bar: "w-1/3 bg-[color:var(--c-level-low)]"
    },
    mid: {
      label: "보통",
      bar: "w-2/3 bg-[color:var(--c-level-mid)]"
    },
    high: {
      label: "혼잡",
      bar: "w-full bg-[color:var(--c-level-high)]"
    }
  };

  const ui = map[level] ?? map.mid;

  return (
    <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] px-3 py-2 transition-[background-color,border-color] duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold text-[color:var(--c-muted)]">
            {title}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[color:var(--c-muted-2)]">
            혼잡도 · {ui.label}
          </p>
        </div>
        <div className="h-2 w-20 overflow-hidden rounded-full bg-[color:var(--c-surface)]">
          <div className={`h-full ${ui.bar}`} />
        </div>
      </div>
    </div>
  );
}

function AutoAttendanceToggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "자동출석 끄기" : "자동출석 켜기"}
      onClick={() => onChange(!enabled)}
      className={[
        "relative inline-flex h-11 w-[96px] items-center rounded-full border shadow-sm transition duration-200 active:scale-[0.98] hover:bg-[color:var(--c-surface-2)]",
        "border-[color:var(--c-border)] bg-[color:var(--c-surface)]"
      ].join(" ")}
    >
      <span className="absolute left-3 text-[11px] font-extrabold text-[color:var(--c-muted-2)]">
        OFF
      </span>
      <span className="absolute right-3 text-[11px] font-extrabold text-[color:var(--c-muted-2)]">
        ON
      </span>
      <span
        aria-hidden="true"
        className={[
          "absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border shadow-sm transition-transform",
          "border-[color:var(--c-border)] bg-[color:var(--c-surface-2)]",
          enabled ? "translate-x-[56px]" : "translate-x-[4px]"
        ].join(" ")}
      >
        <span className="text-[11px] font-extrabold text-[color:var(--c-text)]">
          {enabled ? "ON" : "OFF"}
        </span>
      </span>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const userName = "사용자";
  const attendance = { status: "출석 완료", streakDays: 3 };
  const cardioCongestionLevel = "mid";
  const weightCongestionLevel = "low";
  const todayDayKey = useMemo(() => dayKeyFromDate(new Date()), []);
  const todayRoutines = useMemo(() => {
    const stored = loadRoutinesByDay();
    const list = stored?.[todayDayKey];
    return Array.isArray(list) ? list : [];
  }, [todayDayKey]);
  const firstExerciseId = useMemo(() => {
    if (!todayRoutines.length) return null;
    return resolveExerciseId(todayRoutines[0]?.name);
  }, [todayRoutines]);
  const startPath = firstExerciseId ? `/workout/${firstExerciseId}/run` : "/workout";
  const [autoAttendanceEnabled, setAutoAttendanceEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    const raw = window.localStorage.getItem(AUTO_ATTENDANCE_STORAGE_KEY);
    if (!raw) return false;
    return raw === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      AUTO_ATTENDANCE_STORAGE_KEY,
      autoAttendanceEnabled ? "true" : "false"
    );
  }, [autoAttendanceEnabled]);

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--c-muted)]">
            좋은 하루예요,
          </p>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight">
            {userName}님
          </h2>
        </div>
        <div className="shrink-0 text-right">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-3 py-2 shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--c-text)]" />
            <span className="text-xs font-extrabold text-[color:var(--c-text)]">
              {attendance.status}
            </span>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-[color:var(--c-muted-2)]">
            연속 {attendance.streakDays}일째
          </p>
        </div>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <p className="text-sm font-semibold text-[color:var(--c-muted)]">
            오늘도 한 걸음
          </p>
          <p className="mt-1 text-lg font-extrabold">
            운동을 시작해볼까요?
          </p>

          <div className="mt-4 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-3">
            <p className="text-xs font-extrabold text-[color:var(--c-muted)]">
              오늘 루틴 ({DAY_LABELS[todayDayKey] || ""})
            </p>
            {todayRoutines.length ? (
              <ul className="mt-2 space-y-1.5">
                {todayRoutines.slice(0, 3).map((it) => (
                  <li
                    key={it.id}
                    className="truncate text-sm font-semibold text-[color:var(--c-text)]"
                  >
                    • {it.name || "새 운동"} · {it.sets ?? "-"}세트 · {it.weight ?? "-"}kg
                  </li>
                ))}
                {todayRoutines.length > 3 ? (
                  <li className="text-xs font-semibold text-[color:var(--c-muted-2)]">
                    외 {todayRoutines.length - 3}개
                  </li>
                ) : null}
              </ul>
            ) : (
              <>
                <p className="mt-2 text-xs font-semibold text-[color:var(--c-muted-2)]">
                  설정된 루틴이 없어요. 마이페이지에서 루틴을 추가해 주세요.
                </p>
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="py-3 text-sm"
                    onClick={() => navigate("/mypage/routines")}
                  >
                    루틴 설정하러 가기
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="mt-4">
            <Button
              type="button"
              className="py-5 text-lg"
              onClick={() => navigate(startPath)}
            >
              운동 시작
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--c-muted)]">
              혼잡도
            </p>
            <p className="mt-1 text-lg font-extrabold text-[color:var(--c-text)]">
              지금 운동존 상태
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-extrabold text-[color:var(--c-muted-2)]">
              자동출석
            </p>
            <div className="mt-2">
              <AutoAttendanceToggle
                enabled={autoAttendanceEnabled}
                onChange={setAutoAttendanceEnabled}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <CongestionPill
            title="유산소존"
            level={cardioCongestionLevel}
          />
          <CongestionPill
            title="웨이트존"
            level={weightCongestionLevel}
          />
        </div>
      </Card>
    </section>
  );
}
