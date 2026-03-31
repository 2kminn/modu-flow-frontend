import Card from "@/components/ui/Card";

function Row({ label, value }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="rounded-2xl bg-[color:var(--c-surface-2)] p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold text-[color:var(--c-muted)]">
          {label}
        </p>
        <p className="text-xs font-extrabold text-[color:var(--c-text)]">
          {pct}%
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--c-surface)]">
        <div
          className="h-full rounded-full bg-[color:var(--c-text)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function PostureAccuracy() {
  const overall = 86;
  const breakdown = [
    { label: "스쿼트", value: 82 },
    { label: "푸쉬업", value: 90 },
    { label: "플랭크", value: 88 }
  ];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">
          자세 정확도 통계
        </p>
        <p className="mt-1 text-lg font-extrabold">요약</p>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[color:var(--c-muted)]">
              전체 평균
            </p>
            <p className="mt-1 text-3xl font-extrabold text-[color:var(--c-text)]">
              {overall}%
            </p>
            <p className="mt-2 text-xs font-semibold text-[color:var(--c-muted-2)]">
              최근 7일 기준 (더미)
            </p>
          </div>
          <div
            className="grid h-14 w-14 place-items-center rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] text-[color:var(--c-text)] transition-[background-color,border-color] duration-200"
            aria-hidden="true"
          >
            <svg width="26" height="26" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm4.3 8.7-4.8 4.8a1 1 0 0 1-1.4 0l-2.4-2.4a1 1 0 1 1 1.4-1.4l1.7 1.7 4.1-4.1a1 1 0 1 1 1.4 1.4Z"
              />
            </svg>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {breakdown.map((b) => (
            <Row key={b.label} label={b.label} value={b.value} />
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-extrabold">코칭 포인트</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-semibold text-[color:var(--c-text)]">
          <li>스쿼트: 무릎이 안쪽으로 말리지 않게 주의</li>
          <li>푸쉬업: 코어 고정 유지</li>
          <li>플랭크: 허리 과신전 방지</li>
        </ul>
      </Card>
    </section>
  );
}
