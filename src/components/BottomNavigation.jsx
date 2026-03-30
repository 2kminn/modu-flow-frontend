import { NavLink } from "react-router-dom";
import { BarChart3, Dumbbell, Home, User } from "lucide-react";

function HomeIcon(active) {
  return (
    <Home
      size={24}
      aria-hidden="true"
      className={active ? "text-sky-600" : "text-[color:var(--c-muted-2)]"}
    />
  );
}

function DumbbellIcon(active) {
  return (
    <Dumbbell
      size={24}
      aria-hidden="true"
      className={active ? "text-sky-600" : "text-[color:var(--c-muted-2)]"}
    />
  );
}

function ChartIcon(active) {
  return (
    <BarChart3
      size={24}
      aria-hidden="true"
      className={active ? "text-sky-600" : "text-[color:var(--c-muted-2)]"}
    />
  );
}

function UserIcon(active) {
  return (
    <User
      size={24}
      aria-hidden="true"
      className={active ? "text-sky-600" : "text-[color:var(--c-muted-2)]"}
    />
  );
}

const tabs = [
  { to: "/", label: "홈", end: true, icon: (a) => HomeIcon(a) },
  { to: "/workout", label: "운동", icon: (a) => DumbbellIcon(a) },
  { to: "/stats", label: "기록", icon: (a) => ChartIcon(a) },
  { to: "/mypage", label: "마이페이지", icon: (a) => UserIcon(a) }
];

export default function BottomNavigation() {
  return (
    <nav
      aria-label="하단 네비게이션"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--c-border)] bg-[color:var(--c-surface)] backdrop-blur"
    >
      <div className="mx-auto max-w-[480px] px-3 pb-[env(safe-area-inset-bottom)]">
        <ul className="grid h-[72px] grid-cols-4">
          {tabs.map((tab) => (
            <li key={tab.to} className="h-full">
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  [
                    "flex h-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2",
                    "active:scale-[0.98] transition",
                    isActive
                      ? "text-sky-700"
                      : "text-[color:var(--c-muted)] hover:text-[color:var(--c-text)]"
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "flex h-11 w-14 items-center justify-center rounded-2xl",
                        isActive ? "bg-sky-500/10" : "bg-transparent"
                      ].join(" ")}
                    >
                      {tab.icon(isActive)}
                    </span>
                    <span className="text-[11px] font-semibold leading-none">
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
