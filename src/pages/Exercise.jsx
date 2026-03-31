import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const EXERCISES = {
  squat: {
    title: "스쿼트",
    tip: "무릎이 안쪽으로 모이지 않게, 가슴을 열고 내려가요.",
    target: "하체 · 둔근 · 코어",
    defaultPlan: "3세트 · 10~15회"
  },
  pushup: {
    title: "푸쉬업",
    tip: "몸을 일직선으로 유지하고 팔꿈치를 45도 각도로 굽혀요.",
    target: "가슴 · 삼두 · 코어",
    defaultPlan: "3세트 · 8~12회"
  },
  lunge: {
    title: "런지",
    tip: "앞무릎은 발끝 위에, 상체는 곧게 유지해요.",
    target: "하체 · 균형",
    defaultPlan: "2~3세트 · 좌/우 10회"
  },
  plank: {
    title: "플랭크",
    tip: "허리가 꺾이지 않게 복부에 힘을 주고 버텨요.",
    target: "코어 · 어깨 안정화",
    defaultPlan: "3세트 · 30~60초"
  }
};

export default function Exercise() {
  const navigate = useNavigate();
  const { exerciseId } = useParams();

  const ex = useMemo(() => {
    return EXERCISES[exerciseId] ?? null;
  }, [exerciseId]);

  if (!ex) {
    return (
      <section className="space-y-4">
        <Card>
          <p className="text-lg font-extrabold">운동을 찾을 수 없어요</p>
          <p className="mt-2 text-sm text-[color:var(--c-muted)]">
            다시 선택 페이지로 이동해 주세요.
          </p>
        </Card>
        <Button type="button" variant="secondary" onClick={() => navigate("/workout")}>
          운동 선택으로
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-extrabold shadow-sm transition duration-200 hover:bg-[color:var(--c-surface-2)] active:scale-[0.98]"
          onClick={() => navigate(-1)}
        >
          <span aria-hidden="true">←</span>
          뒤로
        </button>
        <span className="rounded-full border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] px-3 py-2 text-xs font-extrabold text-[color:var(--c-text)] transition-[background-color,border-color] duration-200">
          {ex.target}
        </span>
      </div>

      <Card>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">운동</p>
        <p className="mt-1 text-2xl font-extrabold">{ex.title}</p>
        <p className="mt-3 rounded-2xl bg-[color:var(--c-surface-2)] px-4 py-3 text-sm font-semibold text-[color:var(--c-text)]">
          팁: {ex.tip}
        </p>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">
          오늘의 계획(더미)
        </p>
        <p className="mt-1 text-lg font-extrabold">{ex.defaultPlan}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() => navigate(`/workout/${exerciseId}/run`)}
          >
            운동 시작
          </Button>
          <Button type="button" variant="secondary">
            기록하기
          </Button>
        </div>
      </Card>
    </section>
  );
}
