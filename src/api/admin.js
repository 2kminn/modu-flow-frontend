// 관리자 CMS와 연결되어 대시보드 요약 및 전체 출석 데이터를 조회하고 응답 형식을 통일한다.
import { apiClient } from "@/api/client";
import { normalizeAttendanceRecords } from "@/api/attendance";
import { isDevTestAuthToken } from "@/auth/auth";

const DEV_DASHBOARD_SUMMARY = {
  totalMembers: 328,
  checkedInCount: 124,
  absentCount: 204,
  attendanceRate: 37.8
};

function unwrapData(value) {
  return value?.data && typeof value.data === "object" ? value.data : value;
}

function readNumber(...values) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

export function normalizeAdminDashboardSummary(value) {
  const root = unwrapData(value) ?? {};
  const attendance = root.attendance ?? root.attendanceSummary ?? root.summary ?? {};
  const totalMembers =
    readNumber(
      root.totalMembers,
      root.totalMemberCount,
      root.memberCount,
      attendance.totalMembers,
      attendance.totalMemberCount
    ) ?? 0;
  const checkedInCount =
    readNumber(
      root.checkedInCount,
      root.currentAttendanceCount,
      root.attendanceCount,
      root.presentCount,
      attendance.checkedInCount,
      attendance.presentCount
    ) ?? 0;
  const absentCount =
    readNumber(
      root.absentCount,
      root.notCheckedInCount,
      attendance.absentCount,
      attendance.notCheckedInCount
    ) ?? Math.max(0, totalMembers - checkedInCount);
  const calculatedRate = totalMembers > 0 ? (checkedInCount / totalMembers) * 100 : 0;
  const attendanceRate =
    readNumber(
      root.attendanceRate,
      root.attendancePercentage,
      attendance.attendanceRate,
      attendance.rate
    ) ?? calculatedRate;

  return {
    totalMembers: Math.max(0, Math.round(totalMembers)),
    checkedInCount: Math.max(0, Math.round(checkedInCount)),
    absentCount: Math.max(0, Math.round(absentCount)),
    attendanceRate: Math.max(0, Math.min(100, Math.round(attendanceRate * 10) / 10))
  };
}

export async function fetchAdminDashboardSummary() {
  if (isDevTestAuthToken()) return DEV_DASHBOARD_SUMMARY;

  const res = await apiClient.get("/api/v1/admin/dashboard/summary", {
    skipAuthRedirect: true
  });
  return normalizeAdminDashboardSummary(res?.data);
}

export async function fetchAdminAttendances(params) {
  if (isDevTestAuthToken()) {
    return normalizeAttendanceRecords({
      attendances: [
        {
          id: "A-1001",
          email: "testuser@naver.com",
          name: "김모두",
          status: "출석",
          checkInAt: new Date().toISOString(),
          zoneName: "유산소 존"
        }
      ]
    });
  }

  const res = await apiClient.get("/api/v1/admin/attendances", {
    params: params && Object.keys(params).length ? params : undefined,
    skipAuthRedirect: true
  });
  return normalizeAttendanceRecords(res?.data);
}
