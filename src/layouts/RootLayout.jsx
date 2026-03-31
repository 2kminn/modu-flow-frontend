import { Outlet, useLocation } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ThemeToggle from "@/components/ui/ThemeToggle";

function getTitle(pathname) {
  if (pathname === "/") return "홈";
  if (pathname.startsWith("/workout")) return "운동";
  if (pathname.startsWith("/stats")) return "기록";
  if (pathname === "/mypage") return "마이페이지";
  if (pathname.startsWith("/mypage/workout-diary")) return "운동일지";
  if (pathname.startsWith("/mypage/goals")) return "운동 목표 설정";
  if (pathname.startsWith("/mypage/routines")) return "루틴 설정";
  if (pathname.startsWith("/mypage/posture-accuracy")) return "자세 정확도 통계";
  if (pathname.startsWith("/mypage/attendance")) return "출석률";
  if (pathname.startsWith("/mypage/password")) return "비밀번호 변경";
  if (pathname.startsWith("/mypage")) return "마이페이지";
  return "헬스케어";
}

export default function RootLayout() {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="min-h-dvh bg-[color:var(--c-bg)] text-[color:var(--c-text)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--c-border)] bg-[color:var(--c-surface)] backdrop-blur transition-[background-color,border-color] duration-200">
        <div className="mx-auto flex max-w-[480px] items-center justify-between px-4 pb-3 pt-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-[color:var(--c-muted-2)]">
              ModuFlow
            </p>
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[480px] px-4 pb-28 pt-5">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  );
}
