import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function Routines() {
  const routines = [
    { name: "전신 20분", tag: "초급", items: ["스쿼트", "푸쉬업", "플랭크"] },
    { name: "하체 집중", tag: "중급", items: ["스쿼트", "런지", "힙힌지"] },
    { name: "코어 & 스트레칭", tag: "회복", items: ["플랭크", "브릿지", "스트레칭"] }
  ];

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">
          루틴 설정
        </p>
        <p className="mt-1 text-lg font-extrabold">내 루틴</p>
      </div>

      <Card className="p-0">
        <ul className="divide-y divide-[color:var(--c-border)]">
          {routines.map((r) => (
            <li key={r.name} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[color:var(--c-text)]">
                    {r.name}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-[color:var(--c-muted-2)]">
                    {r.items.join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 rounded-2xl bg-[color:var(--c-surface-2)] px-3 py-2 text-xs font-extrabold text-[color:var(--c-text)]">
                  {r.tag}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary">
                  편집 (더미)
                </Button>
                <Button type="button">시작</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Button type="button" variant="secondary">
        새 루틴 추가 (더미)
      </Button>
    </section>
  );
}
