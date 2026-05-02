import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import WeeklyWorkoutChart from "@/components/charts/WeeklyWorkoutChart";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WORKOUT_HISTORY_STORAGE_KEY = "moduflow:workout-history:v1";

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

function WorkoutListModal({
  open,
  title,
  items,
  onClose,
  onUpdateItem,
  onDeleteItem
}) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!open) return;
    setEditingId(null);
    setDraft(null);
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
                    <div className="mt-3 grid grid-cols-2 gap-2">
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
                      <div className="col-span-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextSetsNum = Number(draft?.sets);
                            const nextWeightNum = Number(draft?.weight);
                            onUpdateItem?.(it.id, {
                              sets:
                                draft?.sets === ""
                                  ? null
                                  : Number.isFinite(nextSetsNum)
                                    ? nextSetsNum
                                    : null,
                              weight:
                                draft?.weight === ""
                                  ? null
                                  : Number.isFinite(nextWeightNum)
                                    ? nextWeightNum
                                    : null
                            });
                            setEditingId(null);
                            setDraft(null);
                          }}
                          className="h-11 flex-1 rounded-2xl bg-[color:var(--c-text)] px-4 text-sm font-extrabold text-[color:var(--c-bg)] shadow-sm transition active:scale-[0.98]"
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
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="rounded-2xl bg-[color:var(--c-surface-2)] px-3 py-2 text-xs font-extrabold text-[color:var(--c-text)]">
                        세트: {it.sets ?? "-"} · 무게: {it.weight ?? "-"}kg
                      </span>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(it.id);
                            setDraft({
                              sets: String(it.sets ?? ""),
                              weight: String(it.weight ?? "")
                            });
                          }}
                          className="h-10 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-3 text-xs font-extrabold text-[color:var(--c-text)] transition hover:bg-[color:var(--c-surface-2)] active:scale-[0.98]"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem?.(it.id)}
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

  const [recordsByDate, setRecordsByDate] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(WORKOUT_HISTORY_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(WORKOUT_HISTORY_STORAGE_KEY, JSON.stringify(recordsByDate));
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
    const attended = Object.keys(workoutByDate).filter((d) => d.startsWith(monthLabel)).length;
    return Math.round((attended / Math.max(1, totalDays)) * 100);
  }, [month, monthLabel, workoutByDate]);

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
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={[
                        "grid aspect-square place-items-center rounded-2xl text-xs font-extrabold transition active:scale-[0.98]",
                        hasWorkout
                          ? "bg-[color:var(--c-text)] text-[color:var(--c-bg)] hover:opacity-90"
                          : "bg-[color:var(--c-surface)] text-[color:var(--c-muted-2)] hover:bg-[color:var(--c-surface)]/80"
                      ].join(" ")}
                      aria-label={`${dateStr}${hasWorkout ? " 운동 기록 있음" : ""}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs font-semibold text-[color:var(--c-muted-2)]">
                표시된 날짜(검정)는 운동 기록이 있는 날이에요. (기준일: {todayLabel})
              </p>
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
        onClose={() => setSelectedDate(null)}
        onUpdateItem={(itemId, patch) => {
          if (!selectedDate) return;
          setRecordsByDate((prev) => {
            const next = { ...(prev || {}) };
            const list = Array.isArray(next[selectedDate]) ? [...next[selectedDate]] : [];
            next[selectedDate] = list.map((it) => (it.id === itemId ? { ...it, ...patch } : it));
            return next;
          });
        }}
        onDeleteItem={(itemId) => {
          if (!selectedDate) return;
          setRecordsByDate((prev) => {
            const next = { ...(prev || {}) };
            const list = Array.isArray(next[selectedDate]) ? next[selectedDate] : [];
            const filtered = list.filter((it) => it.id !== itemId);
            if (filtered.length) next[selectedDate] = filtered;
            else delete next[selectedDate];
            return next;
          });
        }}
      />
    </>
  );
}
