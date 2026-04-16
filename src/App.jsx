import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "@/auth/RequireAuth";
import AuthLayout from "@/layouts/AuthLayout";
import RootLayout from "@/layouts/RootLayout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import MyPage from "@/pages/MyPage";
import SignUp from "@/pages/SignUp";
import Stats from "@/pages/Stats";
import Workout from "@/pages/Workout";
import Exercise from "@/pages/Exercise";
import ExerciseRun from "@/pages/ExerciseRun";
import WorkoutDiary from "@/pages/mypage/WorkoutDiary";
import Goals from "@/pages/mypage/Goals";
import Routines from "@/pages/mypage/Routines";
import PostureAccuracy from "@/pages/mypage/PostureAccuracy";
import Attendance from "@/pages/mypage/Attendance";
import ChangePassword from "@/pages/mypage/ChangePassword";

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
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
        <Route path="/workout/:exerciseId" element={<Exercise />} />
        <Route path="/workout/:exerciseId/run" element={<ExerciseRun />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/mypage/workout-diary" element={<WorkoutDiary />} />
        <Route path="/mypage/goals" element={<Goals />} />
        <Route path="/mypage/routines" element={<Routines />} />
        <Route path="/mypage/posture-accuracy" element={<PostureAccuracy />} />
        <Route path="/mypage/attendance" element={<Attendance />} />
        <Route path="/mypage/password" element={<ChangePassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
