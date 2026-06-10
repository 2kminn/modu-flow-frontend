import { Fragment, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  AUTH_SESSION_CHANGED_EVENT,
  getAuthSessionKey,
  getAuthToken
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

  return <Fragment key={sessionKey}>{children}</Fragment>;
}
