import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { BedDouble, CheckCircle, Dumbbell, Pencil, X, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRecentCongestion, updateCurrentLocation } from "@/api/attendance";
import {
  fetchRoutines,
  loadRoutineRestDaysFromLocalStorage,
  loadRoutinesFromLocalStorage
} from "@/api/routines";
import { startNativeWorkout } from "@/native/androidBridge";

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

function resolveExerciseId(name) {
  if (typeof name !== "string") return null;
  return EXERCISE_NAME_TO_ID[name.trim().toLowerCase()] || null;
}

function resolveRoutineExerciseId(item) {
  if (typeof item?.exerciseId === "string" && item.exerciseId.trim()) {
    return item.exerciseId.trim();
  }
  return resolveExerciseId(item?.name);
}

function normalizeRoutinesByDay(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = Object.create(null);
  for (const [dayKey, list] of Object.entries(raw)) {
    if (!Object.prototype.hasOwnProperty.call(DAY_LABELS, dayKey)) continue;
    if (!Array.isArray(list)) continue;
    out[dayKey] = list.filter((it) => it && typeof it === "object");
  }
  return out;
}

function readNumeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCongestionLevel(value) {
  if (typeof value === "string") {
    const key = value.trim().toLowerCase();
    if (["low", "idle", "free", "easy", "여유", "원활"].includes(key)) {
      return "low";
    }
    if (["mid", "medium", "normal", "moderate", "보통"].includes(key)) {
      return "mid";
    }
    if (["high", "busy", "crowded", "congested", "혼잡", "매우혼잡"].includes(key)) {
      return "high";
    }
  }

  const numericValue = readNumeric(value);
  if (numericValue == null) return null;
  if (numericValue >= 3) return "high";
  if (numericValue >= 2) return "mid";
  return "low";
}

function pickFirstValue(...values) {
  return values.find((value) => value != null && !Array.isArray(value));
}

function findZoneCongestion(data, keywords) {
  if (!data || typeof data !== "object") return null;

  const direct = pickFirstValue(
    ...keywords.flatMap((keyword) => [
      data[keyword],
      data[`${keyword}Zone`],
      data[`${keyword}Congestion`],
      data[`${keyword}CongestionLevel`],
      data.zones?.[keyword],
      data.zoneCongestion?.[keyword],
      data.congestion?.[keyword]
    ])
  );
  if (direct) return direct;

  const lists = [data.zones, data.zoneCongestion, data.congestion, data.items, data];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    const match = list.find((item) => {
      if (!item || typeof item !== "object") return false;
      const label = String(
        item.zone ?? item.zoneName ?? item.zoneId ?? item.name ?? item.type ?? ""
      ).toLowerCase();
      return keywords.some((keyword) => label.includes(keyword));
    });
    if (match) return match;
  }

  return null;
}

function normalizeZoneCongestion(zoneData) {
  if (zoneData == null) return null;
  if (typeof zoneData !== "object") return normalizeCongestionLevel(zoneData);
  return normalizeCongestionLevel(
    zoneData.level ??
      zoneData.status ??
      zoneData.congestionLevel ??
      zoneData.congestion ??
      zoneData.percent ??
      zoneData.percentage ??
      zoneData.rate ??
      zoneData.count
  );
}

function normalizeHomeCongestion(data) {
  const root = data?.data && typeof data.data === "object" ? data.data : data;
  const cardio = findZoneCongestion(root, ["cardio", "aerobic", "유산소"]);
  const weight = findZoneCongestion(root, ["weight", "weights", "free-weight", "웨이트", "근력"]);
  const fallbackLevel = normalizeCongestionLevel(
    root?.level ?? root?.status ?? root?.percent ?? root?.percentage ?? root?.rate ?? root?.count
  );

  return {
    cardio: normalizeZoneCongestion(cardio) ?? fallbackLevel ?? "mid",
    weight: normalizeZoneCongestion(weight) ?? fallbackLevel ?? "mid",
    updatedAt:
      cardio?.occurredAt ??
      weight?.occurredAt ??
      root?.occurredAt ??
      root?.updatedAt ??
      root?.createdAt ??
      null
  };
}

function formatCongestionUpdatedAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function getNativeLocationPayload(detail) {
  if (!detail || typeof detail !== "object") return null;
  const userId = detail.userId ?? detail.androidId ?? detail.deviceId;
  const zoneId = detail.zoneId ?? detail.beaconId ?? detail.minor;
  if (userId == null || zoneId == null) return null;

  return {
    ...detail,
    userId,
    zoneId
  };
}

function CongestionPill({ level, title, loading }) {
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
    <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-primary-soft)] px-3 py-2 transition-[background-color,border-color] duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold text-[color:var(--c-muted)]">
            {title}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[color:var(--c-muted-2)]">
            혼잡도 · {loading ? "확인 중" : ui.label}
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
        enabled
          ? "border-[color:var(--c-border-strong)] bg-[color:var(--c-primary-soft)]"
          : "border-[color:var(--c-border)] bg-[color:var(--c-surface)]"
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
          enabled
            ? "border-[color:var(--c-primary)] bg-[color:var(--c-primary)] text-white"
            : "border-[color:var(--c-border)] bg-[color:var(--c-surface-2)]",
          enabled ? "translate-x-[56px]" : "translate-x-[4px]"
        ].join(" ")}
      >
        <span className="text-[11px] font-extrabold">
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
  const todayDayKey = useMemo(() => dayKeyFromDate(new Date()), []);
  const [startNotice, setStartNotice] = useState(null);
  const [showRoutineOptions, setShowRoutineOptions] = useState(false);
  const [congestion, setCongestion] = useState({
    cardio: "mid",
    weight: "mid",
    updatedAt: null,
    loading: true,
    error: null
  });
  const [routinesByDay, setRoutinesByDay] = useState(() =>
    normalizeRoutinesByDay(loadRoutinesFromLocalStorage())
  );
  const [restDays, setRestDays] = useState(() => loadRoutineRestDaysFromLocalStorage());
  const isTodayRestDay = restDays.includes(todayDayKey);
  const hasAnyRoutine = useMemo(() => {
    return Object.values(routinesByDay || {}).some(
      (list) => Array.isArray(list) && list.length > 0
    );
  }, [routinesByDay]);
  const todayRoutines = useMemo(() => {
    if (isTodayRestDay) return [];
    const list = routinesByDay?.[todayDayKey];
    return Array.isArray(list) ? list : [];
  }, [isTodayRestDay, routinesByDay, todayDayKey]);
  const todayExerciseIds = useMemo(() => {
    return todayRoutines.map(resolveRoutineExerciseId).filter(Boolean);
  }, [todayRoutines]);
  const [autoAttendanceEnabled, setAutoAttendanceEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    const raw = window.localStorage.getItem(AUTO_ATTENDANCE_STORAGE_KEY);
    if (!raw) return false;
    return raw === "true";
  });

  useEffect(() => {
    let cancelled = false;
    async function syncRoutines() {
      try {
        const serverData = await fetchRoutines();
        if (cancelled) return;
        setRoutinesByDay(normalizeRoutinesByDay(serverData));
        if (Array.isArray(serverData?.restDays)) {
          setRestDays(serverData.restDays);
        }
      } catch (e) {
        console.warn("[home routines] fetch failed:", e);
      }
    }
    function syncRestDays() {
      setRestDays(loadRoutineRestDaysFromLocalStorage());
    }

    syncRoutines();
    window.addEventListener("focus", syncRoutines);
    window.addEventListener("storage", syncRestDays);
    window.addEventListener("moduflow:routine-rest-days", syncRestDays);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", syncRoutines);
      window.removeEventListener("storage", syncRestDays);
      window.removeEventListener("moduflow:routine-rest-days", syncRestDays);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      AUTO_ATTENDANCE_STORAGE_KEY,
      autoAttendanceEnabled ? "true" : "false"
    );
  }, [autoAttendanceEnabled]);

  useEffect(() => {
    let cancelled = false;

    async function syncCongestion() {
      setCongestion((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await fetchRecentCongestion();
        if (cancelled) return;
        setCongestion({
          ...normalizeHomeCongestion(data),
          loading: false,
          error: null
        });
      } catch (e) {
        console.warn("[home congestion] fetch failed:", e);
        if (cancelled) return;
        setCongestion((prev) => ({
          ...prev,
          loading: false,
          error: "혼잡도 정보를 불러오지 못했어요."
        }));
      }
    }

    syncCongestion();
    const timer = window.setInterval(syncCongestion, 60_000);
    window.addEventListener("focus", syncCongestion);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", syncCongestion);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let active = true;

    async function handleNativeEvent(event) {
      const detail = event?.detail;
      if (detail?.type === "congestion") {
        setCongestion({
          ...normalizeHomeCongestion(detail),
          loading: false,
          error: null
        });
        return;
      }

      const locationPayload = getNativeLocationPayload(detail);
      if (!locationPayload) return;

      try {
        await updateCurrentLocation(locationPayload);
        const data = await fetchRecentCongestion();
        if (!active) return;
        setCongestion({
          ...normalizeHomeCongestion(data),
          loading: false,
          error: null
        });
      } catch (e) {
        console.warn("[home native location] update failed:", e);
      }
    }

    window.addEventListener("moduflow:native-event", handleNativeEvent);
    return () => {
      active = false;
      window.removeEventListener("moduflow:native-event", handleNativeEvent);
    };
  }, []);

  useEffect(() => {
    if (!startNotice) return;
    const t = window.setTimeout(() => setStartNotice(null), 2200);
    return () => window.clearTimeout(t);
  }, [startNotice]);

  function goToManualRoutineAdd() {
    setShowRoutineOptions(false);
    navigate("/mypage/routines");
  }

  function goToWorkoutSelection() {
    setShowRoutineOptions(false);
    navigate("/workout");
  }

  return (
    <>
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
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--c-border-strong)] bg-[color:var(--c-primary-soft)] px-3 py-2 shadow-sm">
              <CheckCircle size={15} className="text-[color:var(--c-primary)]" aria-hidden="true" />
              <span className="text-xs font-extrabold text-[color:var(--c-primary)]">
                {attendance.status}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-semibold text-[color:var(--c-muted-2)]">
              연속 {attendance.streakDays}일째
            </p>
          </div>
        </div>

        <Card className="overflow-hidden bg-[linear-gradient(135deg,var(--c-primary-soft),var(--c-surface))] p-0">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[color:var(--c-muted)]">
                  오늘도 한 걸음
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  운동을 시작해볼까요?
                </p>
              </div>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[color:var(--c-border-strong)] bg-white/80 text-[color:var(--c-primary)] shadow-sm dark:bg-white/10">
                <Dumbbell size={21} aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-3">
              <p className="text-xs font-extrabold text-[color:var(--c-muted)]">
                오늘 루틴 ({DAY_LABELS[todayDayKey] || ""})
              </p>
              {isTodayRestDay ? (
                <>
                  <div className="mt-2 rounded-2xl border border-[color:var(--c-primary)]/20 bg-[color:var(--c-primary-soft)] px-3 py-3">
                    <p className="text-sm font-extrabold text-[color:var(--c-primary)]">
                      오늘은 쉬는 날이에요.
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
                      휴식일은 기록 캘린더와 출석률 계산에 반영돼요.
                    </p>
                  </div>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="py-3 text-sm"
                      onClick={() => navigate("/mypage/routines")}
                    >
                      휴식일 수정
                    </Button>
                  </div>
                </>
              ) : todayRoutines.length ? (
                <>
                  <ul className="mt-2 space-y-1.5">
                    {todayRoutines.slice(0, 3).map((it) => (
                      <li
                        key={it.id}
                        className="truncate text-sm font-semibold text-[color:var(--c-text)]"
                      >
                        • {it.name || "운동 이름"} · {it.sets ?? "-"}세트 ·{" "}
                        {it.reps ?? "-"}회
                        {it.weight == null || it.weight === ""
                          ? ""
                          : ` · ${it.weight}kg`}
                      </li>
                    ))}
                    {todayRoutines.length > 3 ? (
                      <li className="text-xs font-semibold text-[color:var(--c-muted-2)]">
                        외 {todayRoutines.length - 3}개
                      </li>
                    ) : null}
                  </ul>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="py-3 text-sm"
                      onClick={() => setShowRoutineOptions(true)}
                    >
                      루틴 추가
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="py-3 text-sm"
                      onClick={() => navigate("/mypage/routines")}
                    >
                      루틴 수정
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-xs font-semibold text-[color:var(--c-muted-2)]">
                    {hasAnyRoutine
                      ? "오늘은 루틴이 없어요. 마이페이지에서 루틴을 수정해 주세요."
                      : "설정된 루틴이 없어요. 마이페이지에서 루틴을 추가해 주세요."}
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="py-3 text-sm"
                      onClick={() => setShowRoutineOptions(true)}
                    >
                      루틴 추가하기
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4">
              <Button
                type="button"
                className="gap-2 py-5 text-lg"
                onClick={() => {
                  if (isTodayRestDay) {
                    setStartNotice("오늘은 쉬는 날로 설정되어 있습니다.");
                  } else if (todayRoutines.length) {
                    const started = startNativeWorkout(todayExerciseIds);
                    if (!started) navigate("/workout/run");
                  } else {
                    setStartNotice(
                      "루틴이 설정되지 않았습니다."
                    );
                  }
                }}
              >
                {isTodayRestDay ? (
                  <BedDouble size={20} aria-hidden="true" />
                ) : (
                  <Zap size={20} aria-hidden="true" />
                )}
                {isTodayRestDay ? "쉬는 날" : "운동 시작"}
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
              <p className="mt-1 text-[11px] font-semibold text-[color:var(--c-muted-2)]">
                {congestion.error ??
                  (formatCongestionUpdatedAt(congestion.updatedAt)
                    ? `${formatCongestionUpdatedAt(congestion.updatedAt)} 업데이트`
                    : "최근 출석 기준")}
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
              level={congestion.cardio}
              loading={congestion.loading}
            />
            <CongestionPill
              title="웨이트존"
              level={congestion.weight}
              loading={congestion.loading}
            />
          </div>
        </Card>
      </section>

      {startNotice ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] px-4">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 py-3 text-center text-sm font-extrabold text-[color:var(--c-text)] shadow-lg">
            {startNotice}
          </div>
        </div>
      ) : null}

      {showRoutineOptions ? (
        <div className="fixed -top-24 bottom-[calc(72px+env(safe-area-inset-bottom))] inset-x-0 z-[70] flex items-center justify-center bg-black/40 px-4 pt-24">
          <button
            type="button"
            aria-label="루틴 추가 선택 닫기"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setShowRoutineOptions(false)}
          />
          <div className="relative mx-auto flex w-full max-w-md items-center">
            <Card className="w-full space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--c-muted)]">
                    루틴 추가
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-[color:var(--c-text)]">
                    추가 방식을 선택해 주세요
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="닫기"
                  onClick={() => setShowRoutineOptions(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-muted)] transition hover:bg-[color:var(--c-surface-2)] hover:text-[color:var(--c-text)]"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-2">
                <Button
                  type="button"
                  className="justify-start gap-3 py-4 text-left"
                  onClick={goToWorkoutSelection}
                >
                  <Dumbbell size={20} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    운동 페이지로 이동하기
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="justify-start gap-3 py-4 text-left"
                  onClick={goToManualRoutineAdd}
                >
                  <Pencil size={20} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    수동으로 추가하기
                  </span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
