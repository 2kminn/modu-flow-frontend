import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import WeeklyWorkoutChart from "@/components/charts/WeeklyWorkoutChart";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

function WorkoutListModal({ open, title, items, onClose }) {
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
                    <span className="shrink-0 rounded-2xl bg-[color:var(--c-surface-2)] px-3 py-2 text-xs font-extrabold text-[color:var(--c-text)]">
                      세트: {it.sets ?? "-"} · 무게: {it.weight ?? "-"}kg
                    </span>
                  </div>
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

  const workoutByDate = useMemo(() => {
    // TODO: 실제 운동/자세 분석 데이터 연동 예정
    const currentMonthLabel = formatMonth(month);
    const todayMonthLabel = formatMonth(today);

    if (currentMonthLabel > todayMonthLabel) return {};

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

    return template.reduce((acc, entry) => {
      if (entry.day > maxDay) return acc;
      const key = `${baseY}-${m}-${String(entry.day).padStart(2, "0")}`;
      acc[key] = entry.items;
      return acc;
    }, {});
  }, [month, today]);

  const attendanceRate = useMemo(() => {
    const totalDays = daysInMonth(month);
    const attended = Object.keys(workoutByDate).filter((d) => d.startsWith(monthLabel)).length;
    return Math.round((attended / Math.max(1, totalDays)) * 100);
  }, [month, monthLabel, workoutByDate]);

  const [selectedDate, setSelectedDate] = useState(null);

  const postureAvg = 86;
  const postureTrend = [82, 84, 83, 86, 88, 87, 86];

  const diaryLogs = [
    { date: "2026-03-25", title: "하체 · 스쿼트 중심", duration: "45분" },
    { date: "2026-03-23", title: "상체 · 푸쉬업/풀", duration: "35분" },
    { date: "2026-03-21", title: "코어 · 플랭크", duration: "25분" }
  ].slice().sort((a, b) => (a.date < b.date ? 1 : -1));

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
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
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
                {monthLabelKo} · 운동한 날짜를 눌러 상세를 확인해요.
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
              >
                <ChevronRight size={18} aria-hidden="true" />
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

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold">운동 일지</p>
          <span className="rounded-full bg-[color:var(--c-surface-2)] px-3 py-1.5 text-[11px] font-extrabold text-[color:var(--c-muted)]">
            {diaryLogs.length}건
          </span>
        </div>

        <ul className="mt-3 divide-y divide-[color:var(--c-border)]">
          {diaryLogs.map((l) => (
            <li key={l.date} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[color:var(--c-text)]">
                    {l.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
                    {l.date}
                  </p>
                </div>
                <span className="shrink-0 rounded-2xl bg-[color:var(--c-surface-2)] px-3 py-2 text-xs font-extrabold text-[color:var(--c-text)]">
                  {l.duration}
                </span>
              </div>
            </li>
          ))}
        </ul>
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
      />
    </>
  );
}
