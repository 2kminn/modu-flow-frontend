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

function unwrapData(value) {
  return value?.data && typeof value.data === "object" ? value.data : value;
}

function pickList(value) {
  const root = unwrapData(value);
  const list =
    root?.attendances ??
    root?.attendanceList ??
    root?.records ??
    root?.items ??
    root?.content ??
    root?.data ??
    root;

  return Array.isArray(list) ? list : [];
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
    item.userEmail ??
    item.userId ??
    item.username ??
    user.email ??
    user.userEmail ??
    user.username;
  const name =
    item.name ??
    item.userName ??
    item.nickname ??
    item.memberName ??
    user.name ??
    user.userName ??
    user.nickname;
  const status = item.status ?? item.attendanceStatus ?? item.state;
  const checkInAt =
    item.checkInAt ??
    item.checkedInAt ??
    item.enteredAt ??
    item.createdAt ??
    item.startTime ??
    item.attendanceTime;
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

  if (id == null && email == null && name == null) return null;

  return {
    id: id == null ? `${email ?? name}` : String(id),
    email: email == null ? "" : String(email),
    name: name == null ? "" : String(name),
    status: status == null ? "" : String(status),
    checkInAt: checkInAt == null ? "" : String(checkInAt),
    checkOutAt: checkOutAt == null ? "" : String(checkOutAt),
    zoneName: zoneName == null ? "" : String(zoneName)
  };
}

export function normalizeAttendanceRecords(value) {
  return pickList(value).map(normalizeAttendanceRecord).filter(Boolean);
}

export async function checkInAttendance({ gymName }) {
  const res = await apiClient.post("/api/v1/attendance", { gymName });
  return res?.data;
}

export async function fetchAttendance({ gymName } = {}) {
  if (isDevTestAuthToken()) return { attendances: DEV_ATTENDANCE_RECORDS };

  const res = await apiClient.get("/api/v1/attendance", {
    params: gymName ? { gymName } : undefined
  });
  return res?.data;
}

export async function checkOutAttendance(id) {
  const res = await apiClient.patch(`/api/v1/attendance/checkout/${id}`);
  return res?.data;
}

export async function updateCurrentLocation(payload = {}) {
  if (isDevTestAuthToken()) return { ok: true };

  const userId = payload.userId ?? payload.androidId ?? payload.deviceId;
  const zoneId = payload.zoneId ?? payload.beaconId ?? payload.minor;
  const body = {
    ...payload,
    ...(userId == null ? {} : { userId }),
    ...(zoneId == null ? {} : { zoneId })
  };

  const res = await apiClient.post("/api/v1/update-location", body);
  return res?.data;
}

export async function fetchCongestion({ gymName } = {}) {
  if (isDevTestAuthToken()) return getDevCongestion();

  const res = await apiClient.get("/api/v1/attendance/congestion", {
    params: gymName ? { gymName } : undefined
  });
  return res?.data;
}

export async function fetchRecentCongestion({ gymName } = {}) {
  if (isDevTestAuthToken()) return getDevCongestion();

  const res = await apiClient.get("/api/v1/attendance/congestion/recent", {
    params: gymName ? { gymName } : undefined
  });
  return res?.data;
}
