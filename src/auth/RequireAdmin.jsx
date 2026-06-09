import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  getAuthToken,
  isAdminSession,
  isDevTestAuthToken
} from "@/auth/auth";
import { fetchAdminDashboardSummary } from "@/api/admin";
import Card from "@/components/ui/Card";

export default function RequireAdmin({ children }) {
  const location = useLocation();
  const token = getAuthToken();
  const hasStoredAdminRole = isAdminSession();
  const [serverPermission, setServerPermission] = useState(
    hasStoredAdminRole ? "allowed" : "checking"
  );

  useEffect(() => {
    let active = true;

    if (!token || hasStoredAdminRole) {
      setServerPermission(hasStoredAdminRole ? "allowed" : "denied");
      return () => {
        active = false;
      };
    }

    if (isDevTestAuthToken(token)) {
      setServerPermission("denied");
      return () => {
        active = false;
      };
    }

    setServerPermission("checking");
    fetchAdminDashboardSummary()
      .then(() => {
        if (active) setServerPermission("allowed");
      })
      .catch(() => {
        if (active) setServerPermission("denied");
      });

    return () => {
      active = false;
    };
  }, [hasStoredAdminRole, token]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (serverPermission === "checking") {
    return (
      <div className="grid min-h-dvh place-items-center bg-[color:var(--c-bg)] px-4 text-[color:var(--c-text)]">
        <p className="text-sm font-bold text-[color:var(--c-muted)]">
          관리자 권한을 확인하는 중입니다.
        </p>
      </div>
    );
  }

  if (serverPermission !== "allowed") {
    return (
      <div className="grid min-h-dvh place-items-center bg-[color:var(--c-bg)] px-4 text-[color:var(--c-text)]">
        <Card className="w-full max-w-md rounded-3xl p-6 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[color:var(--c-muted-2)]">
            moduflow admin
          </p>
          <h1 className="mt-2 text-xl font-black">관리자 권한이 필요합니다</h1>
          <p className="mt-2 text-sm font-semibold text-[color:var(--c-muted)]">
            관리자 계정으로 로그인해야 CMS에 접근할 수 있습니다.
          </p>
          <div className="mt-5 flex gap-2">
            <Link
              to="/"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-sm font-extrabold text-[color:var(--c-text)] transition hover:bg-[color:var(--c-surface-2)]"
            >
              홈으로
            </Link>
            <Link
              to="/login"
              state={{ from: location }}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--c-primary),var(--c-purple))] text-sm font-extrabold text-white shadow-sm transition hover:brightness-105"
            >
              로그인
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return children;
}
