import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken } from "@/auth/auth";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
