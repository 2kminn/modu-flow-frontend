import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ExerciseMuscleImage from "@/components/ExerciseMuscleImage";
import { EXERCISE_BY_ID } from "@/data/exercises";

export default function Exercise() {
  const navigate = useNavigate();
  const { exerciseId } = useParams();

  const ex = useMemo(() => {
    return EXERCISE_BY_ID[exerciseId] ?? null;
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
        <ExerciseMuscleImage name={ex.title} areas={ex.muscleAreas} />
        <p className="mt-4 text-sm font-semibold text-[color:var(--c-muted)]">운동</p>
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
