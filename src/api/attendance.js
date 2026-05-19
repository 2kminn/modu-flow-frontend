import { apiClient } from "@/api/client";

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

export async function fetchCongestion({ gymName }) {
  const res = await apiClient.get("/api/v1/attendance/congestion", {
    params: { gymName }
  });
  return res?.data;
}

export async function fetchRecentCongestion({ gymName }) {
  const res = await apiClient.get("/api/v1/attendance/congestion/recent", {
    params: { gymName }
  });
  return res?.data;
}
