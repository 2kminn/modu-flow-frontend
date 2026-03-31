import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { clearAuthToken } from "@/auth/auth";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

function MenuRow({ label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center justify-between gap-4 px-4 py-4 text-left",
        "hover:bg-[color:var(--c-surface-2)] active:bg-[color:var(--c-surface-2)] transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--c-surface)]"
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-[color:var(--c-text)]">
          {label}
        </p>
        {description ? (
          <p className="mt-1 truncate text-xs font-semibold text-[color:var(--c-muted-2)]">
            {description}
          </p>
        ) : null}
      </div>
      <span className="shrink-0 text-[color:var(--c-muted-2)]">
        <ChevronRight size={20} aria-hidden="true" />
      </span>
    </button>
  );
}

export default function MyPage() {
  const navigate = useNavigate();
  const user = {
    name: "사용자",
    bio: "초급 · 주 3회 · 목표: 근력 향상"
  };

  const menus = [
    { label: "운동일지", to: "/mypage/workout-diary", description: "최근 기록/히스토리" },
    { label: "운동 목표 설정", to: "/mypage/goals", description: "주간 목표, 알림" },
    { label: "루틴 설정", to: "/mypage/routines", description: "자주 하는 루틴 관리" },
    { label: "자세 정확도 통계", to: "/mypage/posture-accuracy", description: "자세 피드백 요약" },
    { label: "출석률", to: "/mypage/attendance", description: "주간/월간 출석" },
    { label: "비밀번호 변경", to: "/mypage/password", description: "보안 설정" }
  ];

  return (
    <section className="space-y-4">
      <Card className="p-0">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[color:var(--c-muted)]">
              프로필
            </p>
            <p className="mt-1 truncate text-xl font-extrabold text-[color:var(--c-text)]">
              {user.name}
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-[color:var(--c-muted-2)]">
              {user.bio}
            </p>
          </div>
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] transition-[background-color,border-color] duration-200"
            aria-hidden="true"
          >
            <span className="h-6 w-6 rounded-2xl bg-[color:var(--c-surface)]" />
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <div className="px-4 pb-3 pt-4">
          <p className="text-sm font-extrabold text-[color:var(--c-text)]">
            메뉴
          </p>
          <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
            필요한 설정과 기록을 빠르게 확인해요.
          </p>
        </div>

        <ul className="divide-y divide-[color:var(--c-border)]">
          {menus.map((m) => (
            <li key={m.to}>
              <MenuRow
                label={m.label}
                description={m.description}
                onClick={() => navigate(m.to)}
              />
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-0">
        <div className="px-4 pb-3 pt-4">
          <p className="text-sm font-extrabold text-[color:var(--c-text)]">
            계정
          </p>
          <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
            로그인/보안 관련 설정
          </p>
        </div>

        <div className="px-4 pb-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              clearAuthToken();
              navigate("/login", { replace: true });
            }}
          >
            로그아웃(더미)
          </Button>
        </div>
      </Card>
    </section>
  );
}
