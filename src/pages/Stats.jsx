import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import WeeklyWorkoutChart from "@/components/charts/WeeklyWorkoutChart";

export default function Stats() {
  const weeklyMinutes = [10, 25, 40, 20, 55, 35, 60];
  const records = [
    { date: "2026-03-19", type: "스쿼트", count: "12회" },
    { date: "2026-03-18", type: "푸쉬업", count: "10회" },
    { date: "2026-03-17", type: "플랭크", count: "45초" },
    { date: "2026-03-16", type: "런지", count: "좌/우 10회" }
  ];

  const total = weeklyMinutes.reduce((a, b) => a + b, 0);
  const best = Math.max(...weeklyMinutes);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-600">운동 기록</p>
        <p className="mt-1 text-lg font-extrabold">이번 주 요약</p>
      </div>

      <Card className="p-0">
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-600">주간 운동 시간</p>
              <p className="mt-1 text-2xl font-extrabold">{total}분</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500">최고</p>
              <p className="mt-1 rounded-2xl bg-sky-50 px-3 py-2 text-xs font-extrabold text-sky-700">
                {best}분
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="rounded-3xl bg-slate-50 p-3">
            <WeeklyWorkoutChart data={weeklyMinutes} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold">최근 기록</p>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-extrabold text-slate-600">
            {records.length}건
          </span>
        </div>

        <ul className="mt-3 divide-y divide-slate-100">
          {records.map((r) => (
            <li key={`${r.date}-${r.type}`} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-900">
                    {r.type}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {r.date}
                  </p>
                </div>
                <span className="shrink-0 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-700">
                  {r.count}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Button type="button" variant="secondary">
        상세 통계 보기 (더미)
      </Button>
    </section>
  );
}
