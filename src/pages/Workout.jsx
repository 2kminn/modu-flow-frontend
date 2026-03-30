import Card from "@/components/ui/Card";
import { Link } from "react-router-dom";

const exercises = [
  {
    id: "squat",
    title: "스쿼트",
    desc: "하체·코어 강화",
    meta: "권장 3세트 · 10~15회",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M10.2 6.4a2.4 2.4 0 1 1 3.4 0a2.4 2.4 0 0 1-3.4 0ZM6.8 20.2c-.55 0-1-.45-1-1v-2.5c0-1.28.63-2.45 1.7-3.12l2.3-1.45v-1.6c0-.6.49-1.1 1.1-1.1h2.2c.6 0 1.1.49 1.1 1.1v1.6l2.3 1.45a3.7 3.7 0 0 1 1.7 3.12v2.5c0 .55-.45 1-1 1h-1.1c-.55 0-1-.45-1-1V17c0-.5-.25-.96-.66-1.22L13.4 14.5v4.7c0 .55-.45 1-1 1h-.8c-.55 0-1-.45-1-1v-4.7l-2.14 1.28c-.41.26-.66.72-.66 1.22v2.2c0 .55-.45 1-1 1H6.8Z"
        />
      </svg>
    )
  },
  {
    id: "pushup",
    title: "푸쉬업",
    desc: "가슴·팔·코어",
    meta: "권장 3세트 · 8~12회",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8.2 7.2a2.2 2.2 0 1 1 3.1 0a2.2 2.2 0 0 1-3.1 0ZM4.4 14.2c0-.7.57-1.2 1.2-1.2h2.1l2.2-1.5c.25-.17.55-.27.86-.27h2.9c.3 0 .6.1.86.27L19 13h.4c.7 0 1.2.57 1.2 1.2s-.57 1.2-1.2 1.2H18.6c-.24 0-.48-.07-.68-.2l-2.4-1.6v1.9c0 .7-.57 1.2-1.2 1.2H9.6c-.7 0-1.2-.57-1.2-1.2v-1.9l-2.4 1.6c-.2.13-.44.2-.68.2H5.6c-.7 0-1.2-.57-1.2-1.2Z"
        />
      </svg>
    )
  },
  {
    id: "lunge",
    title: "런지",
    desc: "균형·하체 강화",
    meta: "권장 2~3세트 · 좌/우 10회",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M13.2 6.3a2.3 2.3 0 1 0-4.6 0a2.3 2.3 0 0 0 4.6 0Zm-6.7 13c-.6 0-1.1-.5-1.1-1.1v-2.3c0-1.55.8-2.98 2.11-3.77l1.79-1.07V9.9c0-.61.49-1.1 1.1-1.1h2.1c.3 0 .58.12.78.32l2.42 2.42c.4.4.4 1.1 0 1.5c-.4.4-1.1.4-1.5 0l-1.7-1.7v1.6l2.1 1.2c1.2.7 2 2 2 3.4v1.7c0 .6-.5 1.1-1.1 1.1h-1c-.6 0-1.1-.5-1.1-1.1v-1.7c0-.5-.26-.96-.7-1.21l-1.2-.69v3.6c0 .6-.5 1.1-1.1 1.1H9.5c-.6 0-1.1-.5-1.1-1.1v-4l-1.45.86c-.66.4-1.05 1.12-1.05 1.9v2.3c0 .6-.5 1.1-1.1 1.1h-.3Z"
        />
      </svg>
    )
  },
  {
    id: "plank",
    title: "플랭크",
    desc: "코어 안정화",
    meta: "권장 3세트 · 30~60초",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M9 7.2a2.2 2.2 0 1 1 3.1 0a2.2 2.2 0 0 1-3.1 0Zm-4.4 9c0-.7.57-1.2 1.2-1.2H20c.7 0 1.2.57 1.2 1.2s-.57 1.2-1.2 1.2H5.8c-.7 0-1.2-.57-1.2-1.2Zm2.6-2.2c0-.5.3-.95.77-1.12l4.6-1.65c.26-.1.55-.08.8.03l2.2 1.03c.6.28.86.99.58 1.6c-.28.6-.99.86-1.6.58l-1.83-.86l-4.07 1.46c-.78.28-1.65-.12-1.65-1.07Z"
        />
      </svg>
    )
  }
];

export default function Workout() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">
          운동 선택
        </p>
        <p className="mt-1 text-lg font-extrabold">오늘 어떤 운동을 할까요?</p>
        <p className="mt-2 text-sm text-[color:var(--c-muted)]">
          카드를 눌러 상세 화면으로 이동해요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {exercises.map((ex) => (
          <Link key={ex.id} to={`/workout/${ex.id}`} className="block">
            <Card className="p-0">
              <div className="flex items-center gap-4 p-4">
                <div className="grid h-14 w-14 place-items-center rounded-3xl bg-sky-50 text-sky-700">
                  {ex.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-base font-extrabold">
                      {ex.title}
                    </p>
                    <span className="shrink-0 rounded-full bg-[color:var(--c-surface-2)] px-2.5 py-1 text-[11px] font-extrabold text-[color:var(--c-muted)]">
                      {ex.desc}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--c-muted)]">
                    {ex.meta}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
