import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "@/auth/RequireAuth";
import AuthLayout from "@/layouts/AuthLayout";
import RootLayout from "@/layouts/RootLayout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import OAuthCallback from "@/pages/OAuthCallback";
import ForgotPassword from "@/pages/ForgotPassword";
import MyPage from "@/pages/MyPage";
import SignUp from "@/pages/SignUp";
import Stats from "@/pages/Stats";
import Workout from "@/pages/Workout";
import Exercise from "@/pages/Exercise";
import ExerciseRun from "@/pages/ExerciseRun";
import WorkoutRun from "@/pages/WorkoutRun";
import Routines from "@/pages/mypage/Routines";
import ChangePassword from "@/pages/mypage/ChangePassword";
import ApiErrorToast from "@/components/ApiErrorToast";

export default function App() {
  return (
    <>
      <ApiErrorToast />
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        <Route
          element={
            <RequireAuth>
              <RootLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Home />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/workout/run" element={<WorkoutRun />} />
          <Route path="/workout/:exerciseId" element={<Exercise />} />
          <Route path="/workout/:exerciseId/run" element={<ExerciseRun />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/workout-diary" element={<Navigate to="/stats" replace />} />
          <Route path="/mypage/posture-accuracy" element={<Navigate to="/stats" replace />} />
          <Route path="/mypage/attendance" element={<Navigate to="/stats" replace />} />
          <Route path="/mypage/goals" element={<Navigate to="/mypage" replace />} />
          <Route path="/mypage/routines" element={<Routines />} />
          <Route path="/mypage/password" element={<ChangePassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
