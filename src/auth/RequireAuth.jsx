// RootLayout 앞에서 로그인 여부를 검사하며, 미인증 사용자는 로그인으로 관리자는 CMS로 이동시킨다.
import { Fragment, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  AUTH_SESSION_CHANGED_EVENT,
  getAuthSessionKey,
  getAuthToken,
  isAdminSession
} from "@/auth/auth";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const [sessionKey, setSessionKey] = useState(() => getAuthSessionKey());
  const token = getAuthToken();

  useEffect(() => {
    function syncSession() {
      setSessionKey(getAuthSessionKey());
    }

    window.addEventListener("storage", syncSession);
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, syncSession);
    };
  }, []);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isAdminSession()) {
    return <Navigate to="/admin" replace />;
  }

  return <Fragment key={sessionKey}>{children}</Fragment>;
}
