import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

function ProgressBar({ value, total }) {
  const pct = Math.min(100, Math.round((value / total) * 100));
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>진행률</span>
        <span className="font-extrabold text-slate-900">{pct}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Goals() {
  const weekly = { targetMinutes: 180, doneMinutes: 95, sessions: 3 };

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-600">운동 목표 설정</p>
        <p className="mt-1 text-lg font-extrabold">이번 주 목표</p>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-600">주간 운동 시간</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {weekly.doneMinutes} / {weekly.targetMinutes}분
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              목표 세션 · {weekly.sessions}회 (더미)
            </p>
          </div>
          <span className="rounded-2xl bg-sky-50 px-3 py-2 text-xs font-extrabold text-sky-700">
            알림 ON
          </span>
        </div>

        <ProgressBar value={weekly.doneMinutes} total={weekly.targetMinutes} />
      </Card>

      <Card>
        <p className="text-sm font-extrabold">빠른 설정</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[11px] font-extrabold text-slate-500">주 3회</p>
            <p className="mt-1 text-sm font-extrabold">가볍게</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[11px] font-extrabold text-slate-500">주 5회</p>
            <p className="mt-1 text-sm font-extrabold">집중</p>
          </div>
        </div>

        <div className="mt-4">
          <Button type="button" className="py-5 text-lg">
            목표 수정 (더미)
          </Button>
        </div>
      </Card>
    </section>
  );
}

