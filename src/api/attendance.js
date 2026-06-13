// 홈·통계·관리자 화면의 출석 체크, 위치 갱신, 혼잡도 및 출석 목록 API를 담당한다.
import { apiClient } from "@/api/client";
import { isDevTestAuthToken } from "@/auth/auth";

const DEV_ATTENDANCE_RECORDS = [
  {
    id: "A-1001",
    email: "testuser@naver.com",
    name: "김모두",
    status: "출석",
    checkInAt: new Date().toISOString(),
    zoneName: "유산소존"
  },
  {
    id: "A-1002",
    email: "member01@gmail.com",
    name: "이회원",
    status: "출석",
    checkInAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    zoneName: "웨이트존"
  }
];

function getDevCongestion() {
  return {
    zones: [
      { zoneName: "유산소존", level: "mid" },
      { zoneName: "웨이트존", level: "low" }
    ],
    updatedAt: new Date().toISOString()
  };
}

function pickList(value) {
  let current = value;
  const visited = new Set();

  while (current && typeof current === "object" && !visited.has(current)) {
    if (Array.isArray(current)) return current;
    visited.add(current);

    const list =
      current.attendances ??
      current.attendanceList ??
      current.records ??
      current.items ??
      current.content;
    if (Array.isArray(list)) return list;

    current = current.data;
  }

  return [];
}

export function normalizeAttendanceRecord(item) {
  if (!item || typeof item !== "object") return null;

  const user = item.user ?? item.member ?? item.account ?? {};
  const id =
    item.id ??
    item.attendanceId ??
    item.recordId ??
    item.userId ??
    user.id ??
    user.userId;
  const email =
    item.email ??
    item.maskedEmail ??
    item.userEmail ??
    item.userId ??
    item.username ??
    user.email ??
    user.maskedEmail ??
    user.userEmail ??
    user.username;
  const name =
    item.name ??
    item.maskedName ??
    item.userName ??
    item.nickname ??
    item.memberName ??
    user.name ??
    user.maskedName ??
    user.userName ??
    user.nickname;
  const status = item.status ?? item.attendanceStatus ?? item.state;
  const checkInAt =
    item.checkInAt ??
    item.checkInTime ??
    item.checkedInAt ??
    item.checkedAt ??
    item.enteredAt ??
    item.createdAt ??
    item.startTime ??
    item.attendanceTime ??
    item.attendanceDate ??
    item.occurredAt ??
    item.date;
  const checkOutAt =
    item.checkOutAt ??
    item.checkedOutAt ??
    item.exitedAt ??
    item.endTime;
  const zoneName =
    item.zoneName ??
    item.zone ??
    item.location ??
    item.beaconZoneName ??
    item.currentZoneName;

  if (
    id == null &&
    email == null &&
    name == null &&
    checkInAt == null &&
    status == null
  ) {
    return null;
  }

  return {
    id: id == null ? String(email ?? name ?? checkInAt ?? "") : String(id),
    email: email == null ? "" : String(email),
    name: name == null ? "" : String(name),
    status: status == null ? "" : String(status),
    checkInAt: checkInAt == null ? "" : String(checkInAt),
    checkOutAt: checkOutAt == null ? "" : String(checkOutAt),
    zoneName: zoneName == null ? "" : String(zoneName),
    gymName: item.gymName == null ? "" : String(item.gymName)
  };
}

export function normalizeAttendanceRecords(value) {
  return pickList(value).map(normalizeAttendanceRecord).filter(Boolean);
}

export async function checkInAttendance({ gymName }, config) {
  const res = await apiClient.post("/api/v1/attendance", { gymName }, config);
  return res?.data;
}

export async function fetchAttendance({ gymName } = {}, config) {
  if (isDevTestAuthToken()) return { attendances: DEV_ATTENDANCE_RECORDS };

  const res = await apiClient.get("/api/v1/attendance", {
    ...config,
    params: gymName ? { gymName } : undefined
  });
  return res?.data;
}

export async function checkOutAttendance(id) {
  const res = await apiClient.patch(`/api/v1/attendance/checkout/${id}`);
  return res?.data;
}

export async function updateCurrentLocation(payload = {}, config) {
  if (isDevTestAuthToken()) return { ok: true };

  const userId =
    payload.userId ??
    payload.user_id ??
    payload.androidId ??
    payload.android_id ??
    payload.deviceId ??
    payload.device_id;
  const zoneId =
    payload.zoneId ??
    payload.zone_id ??
    payload.beaconId ??
    payload.beacon_id ??
    payload.minor ??
    payload.beaconMinor ??
    payload.zoneCode ??
    payload.zone_code;
  const body = {
    ...payload,
    ...(userId == null ? {} : { userId }),
    ...(zoneId == null ? {} : { zoneId })
  };

  const res = await apiClient.post("/api/v1/update-location", body, config);
  return res?.data;
}

export async function fetchCongestion({ gymName } = {}) {
  if (isDevTestAuthToken()) return getDevCongestion();

  const res = await apiClient.get("/api/v1/attendance/congestion", {
    params: gymName ? { gymName } : undefined
  });
  return res?.data;
}

export async function fetchRecentCongestion(
  { gymName } = {},
  { skipAuthRedirect = false } = {}
) {
  if (isDevTestAuthToken()) {
    return {
      zones: [],
      updatedAt: null
    };
  }

  const res = await apiClient.get("/api/v1/attendance/congestion/recent", {
    params: gymName ? { gymName } : undefined,
    skipAuthRedirect
  });
  return res?.data;
}
