import { apiClient } from "@/api/client";
import { isDevTestAuthToken } from "@/auth/auth";

function getDevCongestion() {
  return {
    zones: [
      { zoneName: "유산소존", level: "mid" },
      { zoneName: "웨이트존", level: "low" }
    ],
    updatedAt: new Date().toISOString()
  };
}

export async function checkInAttendance({ gymName }) {
  const res = await apiClient.post("/api/v1/attendance", { gymName });
  return res?.data;
}

export async function fetchAttendance({ gymName } = {}) {
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
