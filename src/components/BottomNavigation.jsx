import { NavLink } from "react-router-dom";

function HomeIcon(active) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={active ? "text-sky-600" : "text-slate-500"}
    >
      <path
        fill="currentColor"
        d="M12 3.2 3.2 10.4c-.4.33-.47.92-.14 1.32.18.22.45.35.73.35H5v7.2c0 .66.54 1.2 1.2 1.2h3.6v-5.4c0-.66.54-1.2 1.2-1.2h2c.66 0 1.2.54 1.2 1.2v5.4h3.6c.66 0 1.2-.54 1.2-1.2V12.1h1.21c.53 0 .97-.43.97-.97 0-.29-.13-.56-.35-.74L12 3.2Z"
      />
    </svg>
  );
}

function DumbbellIcon(active) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={active ? "text-sky-600" : "text-slate-500"}
    >
      <path
        fill="currentColor"
        d="M7.2 8.6a1.2 1.2 0 0 1 1.7 0l6.5 6.5a1.2 1.2 0 0 1-1.7 1.7l-6.5-6.5a1.2 1.2 0 0 1 0-1.7Z"
      />
      <path
        fill="currentColor"
        d="M4.1 6.2a1.2 1.2 0 0 1 1.7 0l1 1a1.2 1.2 0 0 1-1.7 1.7l-1-1a1.2 1.2 0 0 1 0-1.7Zm13.2 13.2a1.2 1.2 0 0 1 1.7 0l1 1a1.2 1.2 0 0 1-1.7 1.7l-1-1a1.2 1.2 0 0 1 0-1.7Z"
      />
      <path
        fill="currentColor"
        d="M3.1 8.3a1.2 1.2 0 0 1 1.7 0l1.6 1.6a1.2 1.2 0 1 1-1.7 1.7L3.1 10a1.2 1.2 0 0 1 0-1.7Zm14.5 14.5a1.2 1.2 0 0 1 1.7 0l1.6 1.6a1.2 1.2 0 1 1-1.7 1.7l-1.6-1.6a1.2 1.2 0 0 1 0-1.7Z"
      />
    </svg>
  );
}

function ChartIcon(active) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={active ? "text-sky-600" : "text-slate-500"}
    >
      <path
        fill="currentColor"
        d="M5.5 20.2c-.66 0-1.2-.54-1.2-1.2V5c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2v14h12.8c.66 0 1.2.54 1.2 1.2s-.54 1.2-1.2 1.2H5.5Z"
      />
      <path
        fill="currentColor"
        d="M10 16.4c-.66 0-1.2-.54-1.2-1.2V11c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2v4.2c0 .66-.54 1.2-1.2 1.2Zm4 0c-.66 0-1.2-.54-1.2-1.2V8.2c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2v7c0 .66-.54 1.2-1.2 1.2Zm4 0c-.66 0-1.2-.54-1.2-1.2v-2.8c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2v2.8c0 .66-.54 1.2-1.2 1.2Z"
      />
    </svg>
  );
}

function UserIcon(active) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={active ? "text-sky-600" : "text-slate-500"}
    >
      <path
        fill="currentColor"
        d="M12 12.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0 2.2c-4.37 0-7.9 2.03-7.9 4.53 0 .7.57 1.27 1.27 1.27h13.26c.7 0 1.27-.57 1.27-1.27 0-2.5-3.53-4.53-7.9-4.53Z"
      />
    </svg>
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur"
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
                      : "text-slate-600 hover:text-slate-900"
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "flex h-11 w-14 items-center justify-center rounded-2xl",
                        isActive ? "bg-sky-50" : "bg-transparent"
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
