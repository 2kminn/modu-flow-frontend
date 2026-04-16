import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { ChevronLeft } from "lucide-react";

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
  const navigate = useNavigate();
  const title = getTitle(location.pathname);
  const showBack = location.pathname !== "/";

  return (
    <div className="min-h-dvh bg-[color:var(--c-bg)] text-[color:var(--c-text)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--c-border)] bg-[color:var(--c-surface)] backdrop-blur transition-[background-color,border-color] duration-200">
        <div className="mx-auto max-w-[480px] px-4 pb-3 pt-4">
          <div className="relative flex items-center justify-between">
            <div className="flex items-center">
              {showBack ? (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined" && window.history.length > 1) {
                      navigate(-1);
                    } else {
                      navigate("/", { replace: true });
                    }
                  }}
                  className={[
                    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                    "border border-[color:var(--c-border)] bg-[color:var(--c-surface)] shadow-sm",
                    "transition duration-200 hover:bg-[color:var(--c-surface-2)] active:scale-[0.98]",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--c-surface)]"
                  ].join(" ")}
                  aria-label="뒤로가기"
                >
                  <ChevronLeft size={20} aria-hidden="true" />
                </button>
              ) : (
                <div className="h-11 w-11" aria-hidden="true" />
              )}
            </div>

            <h1 className="pointer-events-none absolute left-1/2 top-1/2 max-w-[70%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-lg font-bold leading-tight">
              {title}
            </h1>

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
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
