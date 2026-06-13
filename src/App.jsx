// 전체 라우트를 정의한다. 인증 화면은 AuthLayout, 일반 사용자 화면은 RootLayout과 RequireAuth에 연결된다.
import { Navigate, Route, Routes } from "react-router-dom";
import RequireAdmin from "@/auth/RequireAdmin";
import RequireAuth from "@/auth/RequireAuth";
import AuthLayout from "@/layouts/AuthLayout";
import RootLayout from "@/layouts/RootLayout";
import Home from "@/pages/Home";
import AdminCMS from "@/pages/AdminCMS";
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
      {/* API 모듈에서 전달한 공통 오류를 현재 화면 위에 표시한다. */}
      <ApiErrorToast />
      <Routes>
        {/* 로그인 전에도 접근할 수 있는 인증 관련 화면이다. */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* 관리자 권한을 서버와 세션에서 확인한 뒤 CMS 화면을 연다. */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminCMS />
            </RequireAdmin>
          }
        />
        {/* 로그인한 일반 사용자가 이용하는 메인 애플리케이션 영역이다. */}
        <Route
          path="/cms"
          element={
            <RequireAdmin>
              <AdminCMS />
            </RequireAdmin>
          }
        />

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
