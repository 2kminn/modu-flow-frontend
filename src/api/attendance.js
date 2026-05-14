import { apiClient } from "@/api/client";

function unwrapApiData(payload) {
  if (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }
  return payload;
}

export async function checkInAttendance({ gymName }) {
  const res = await apiClient.post("/attendance", { gymName });
  return unwrapApiData(res?.data);
}

export async function fetchAttendance({ gymName } = {}) {
  const res = await apiClient.get("/attendance", {
    params: gymName ? { gymName } : undefined
  });
  return unwrapApiData(res?.data);
}

export async function checkOutAttendance(id) {
  const res = await apiClient.patch(`/attendance/checkout/${id}`);
  return unwrapApiData(res?.data);
}

export async function fetchCongestion({ gymName }) {
  const res = await apiClient.get("/attendance/congestion", {
    params: { gymName }
  });
  return unwrapApiData(res?.data);
}

export async function fetchRecentCongestion({ gymName }) {
  const res = await apiClient.get("/attendance/congestion/recent", {
    params: { gymName }
  });
  return unwrapApiData(res?.data);
}
