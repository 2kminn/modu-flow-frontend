import Card from "@/components/ui/Card";

export default function WorkoutDiary() {
  const logs = [
    { date: "2026-03-25", title: "하체 · 스쿼트 중심", duration: "45분" },
    { date: "2026-03-23", title: "상체 · 푸쉬업/풀", duration: "35분" },
    { date: "2026-03-21", title: "코어 · 플랭크", duration: "25분" }
  ];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">
          운동일지
        </p>
        <p className="mt-1 text-lg font-extrabold">최근 운동 기록</p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold">이번 달 요약</p>
          <span className="rounded-full bg-[color:var(--c-surface-2)] px-3 py-1.5 text-[11px] font-extrabold text-[color:var(--c-muted)]">
            7회
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[color:var(--c-surface-2)] p-3">
            <p className="text-[11px] font-extrabold text-[color:var(--c-muted-2)]">
              총 시간
            </p>
            <p className="mt-1 text-xl font-extrabold">310분</p>
          </div>
          <div className="rounded-2xl bg-[color:var(--c-surface-2)] p-3">
            <p className="text-[11px] font-extrabold text-[color:var(--c-muted-2)]">
              평균
            </p>
            <p className="mt-1 text-xl font-extrabold">44분</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold">기록</p>
          <span className="text-xs font-semibold text-[color:var(--c-muted-2)]">
            더보기 (더미)
          </span>
        </div>

        <ul className="mt-3 divide-y divide-[color:var(--c-border)]">
          {logs.map((l) => (
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
    </section>
  );
}
