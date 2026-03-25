import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { clearAuthToken } from "@/auth/auth";
import { useNavigate } from "react-router-dom";

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.29 6.71a1 1 0 0 1 1.42 0l5 5a1 1 0 0 1 0 1.42l-5 5a1 1 0 1 1-1.42-1.42L13.59 12 9.3 7.71a1 1 0 0 1 0-1.42Z"
      />
    </svg>
  );
}

function MenuRow({ label, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center justify-between gap-4 px-4 py-4 text-left",
        "hover:bg-slate-50 active:bg-slate-100 transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-slate-900">
          {label}
        </p>
        {description ? (
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      <span className="shrink-0 text-slate-400">
        <ChevronRight />
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
            <p className="text-sm font-semibold text-slate-600">프로필</p>
            <p className="mt-1 truncate text-xl font-extrabold text-slate-900">
              {user.name}
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              {user.bio}
            </p>
          </div>
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-sky-200 to-indigo-200"
            aria-hidden="true"
          >
            <span className="h-6 w-6 rounded-2xl bg-white/70" />
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <div className="px-4 pb-3 pt-4">
          <p className="text-sm font-extrabold text-slate-900">메뉴</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            필요한 설정과 기록을 빠르게 확인해요.
          </p>
        </div>

        <ul className="divide-y divide-slate-100">
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
          <p className="text-sm font-extrabold text-slate-900">계정</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            로그인/보안 관련 설정
          </p>
        </div>

        <div className="px-4 pb-4">
          <Button
            type="button"
            variant="secondary"
            className="border-rose-200 text-rose-700 hover:bg-rose-50"
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
