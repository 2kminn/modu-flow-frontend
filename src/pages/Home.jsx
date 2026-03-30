import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

function CongestionPill({ level }) {
  const map = {
    low: {
      label: "여유",
      bar: "w-1/3 bg-emerald-500",
      text: "text-emerald-700",
      bg: "bg-emerald-50"
    },
    mid: {
      label: "보통",
      bar: "w-2/3 bg-amber-500",
      text: "text-amber-800",
      bg: "bg-amber-50"
    },
    high: {
      label: "혼잡",
      bar: "w-full bg-rose-500",
      text: "text-rose-700",
      bg: "bg-rose-50"
    }
  };

  const ui = map[level] ?? map.mid;

  return (
    <div className={`rounded-2xl px-3 py-2 ${ui.bg}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-xs font-extrabold ${ui.text}`}>혼잡도 · {ui.label}</p>
        <div className="h-2 w-20 overflow-hidden rounded-full bg-white/70">
          <div className={`h-full ${ui.bar}`} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const userName = "사용자";
  const attendance = { status: "출석 완료", streakDays: 3 };
  const today = { minutes: 45, sessions: 1 };
  const congestionLevel = "mid";

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
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
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

          <div className="mt-4">
            <Button type="button" className="py-5 text-lg">
              운동 시작
            </Button>
          </div>

          <div className="mt-4">
            <CongestionPill level={congestionLevel} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[color:var(--c-muted)]">
              오늘 운동 요약
            </p>
            <p className="mt-1 text-lg font-extrabold text-[color:var(--c-text)]">
              {today.minutes}분 · {today.sessions}회
            </p>
          </div>
          <div
            className="grid h-14 w-14 place-items-center rounded-3xl bg-sky-50 text-sky-700"
            aria-hidden="true"
          >
            <svg width="26" height="26" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9Zm1-14h-2v5.2l4.2 2.5 1-1.65-3.2-1.85V7Z"
              />
            </svg>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[color:var(--c-surface-2)] p-3">
            <p className="text-[11px] font-extrabold text-[color:var(--c-muted-2)]">
              운동 시간
            </p>
            <p className="mt-1 text-xl font-extrabold">{today.minutes}분</p>
          </div>
          <div className="rounded-2xl bg-[color:var(--c-surface-2)] p-3">
            <p className="text-[11px] font-extrabold text-[color:var(--c-muted-2)]">
              운동 횟수
            </p>
            <p className="mt-1 text-xl font-extrabold">{today.sessions}회</p>
          </div>
        </div>
      </Card>
    </section>
  );
}
