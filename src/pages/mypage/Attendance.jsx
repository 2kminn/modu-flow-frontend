import Card from "@/components/ui/Card";

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl bg-[color:var(--c-surface-2)] p-3">
      <p className="text-[11px] font-extrabold text-[color:var(--c-muted-2)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-extrabold text-[color:var(--c-text)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] font-semibold text-[color:var(--c-muted-2)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function Attendance() {
  const rate = 78;
  const streak = 3;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">
          출석률
        </p>
        <p className="mt-1 text-lg font-extrabold">이번 달</p>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[color:var(--c-muted)]">
              월간 출석률
            </p>
            <p className="mt-1 text-3xl font-extrabold text-[color:var(--c-text)]">
              {rate}%
            </p>
          </div>
          <span className="rounded-2xl bg-[color:var(--c-text)] px-3 py-2 text-xs font-extrabold text-[color:var(--c-bg)] transition-[background-color] duration-200">
            연속 {streak}일
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="출석" value="18일" hint="운동 완료 기준 (더미)" />
          <Stat label="결석" value="5일" hint="휴식 포함 (더미)" />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-extrabold">캘린더</p>
          <span className="text-xs font-semibold text-[color:var(--c-muted-2)]">
            2026-03
          </span>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }).map((_, i) => {
            const day = i + 1;
            const active = day % 3 === 0;
            return (
              <div
                key={day}
                className={[
                  "grid aspect-square place-items-center rounded-2xl text-xs font-extrabold",
                  active
                    ? "bg-[color:var(--c-text)] text-[color:var(--c-bg)]"
                    : "bg-[color:var(--c-surface-2)] text-[color:var(--c-muted-2)]"
                ].join(" ")}
                aria-label={`${day}일`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

