import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { clearAuthToken } from "@/auth/auth";
import { useState } from "react";
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

function LogoutConfirmDialog({ onCancel, onConfirm }) {
  return (
    <div
      className="fixed -top-24 bottom-[calc(72px+env(safe-area-inset-bottom))] inset-x-0 z-50 flex items-center justify-center bg-black/45 px-4 pt-24"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        className="w-full max-w-sm rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="logout-dialog-title"
          className="text-lg font-extrabold text-[color:var(--c-text)]"
        >
          로그아웃하시겠어요?
        </h2>
        <p
          id="logout-dialog-description"
          className="mt-2 text-sm font-semibold leading-6 text-[color:var(--c-muted)]"
        >
          현재 계정에서 로그아웃하고 로그인 화면으로 이동합니다.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            취소
          </Button>
          <Button type="button" onClick={onConfirm}>
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MyPage() {
  const navigate = useNavigate();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const user = {
    name: "사용자",
    bio: "초급 · 주 3회 · 목표: 근력 향상"
  };

  const menus = [
    { label: "루틴 설정", to: "/mypage/routines", description: "자주 하는 루틴 관리" },
    { label: "비밀번호 변경", to: "/mypage/password", description: "보안 설정" }
  ];

  const handleLogout = () => {
    clearAuthToken();
    navigate("/login", { replace: true });
  };

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
            기록은 '기록' 탭에서 확인하고, 여기서는 계정/설정을 관리해요.
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
            onClick={() => setIsLogoutDialogOpen(true)}
          >
            로그아웃
          </Button>
        </div>
      </Card>

      {isLogoutDialogOpen ? (
        <LogoutConfirmDialog
          onCancel={() => setIsLogoutDialogOpen(false)}
          onConfirm={handleLogout}
        />
      ) : null}
    </section>
  );
}
