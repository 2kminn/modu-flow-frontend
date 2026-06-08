import { apiClient } from "@/api/client";
import { isDevTestAuthToken } from "@/auth/auth";

export const BEACON_ZONES_STORAGE_KEY = "moduflow:beacon-zones:v1";
export const BEACON_ZONES_EVENT = "moduflow:beacon-zones";

export const DEFAULT_BEACON_ZONES = [
  { id: "B001", name: "유산소 존", capacity: 30 },
  { id: "B002", name: "웨이트 존", capacity: 50 },
  { id: "B003", name: "스트레칭 존", capacity: 20 }
];

function readNumeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeBeaconZone(item) {
  if (!item || typeof item !== "object") return null;
  const id =
    item.id ??
    item.beaconId ??
    item.zoneId ??
    item.minor ??
    item.uuid;
  const name =
    item.name ??
    item.zoneName ??
    item.beaconName ??
    item.title ??
    item.label;
  const capacity = readNumeric(
    item.capacity ??
    item.maxCapacity ??
    item.limit ??
    item.acceptableCapacity ??
    item.totalCapacity
  );

  if (id == null || String(id).trim() === "") return null;
  return {
    id: String(id).trim(),
    name: String(name ?? id).trim() || String(id).trim(),
    capacity: capacity == null || capacity <= 0 ? 1 : Math.round(capacity)
  };
}

export function normalizeBeaconZones(value) {
  const root = value?.data && typeof value.data === "object" ? value.data : value;
  const list =
    root?.beaconZones ??
    root?.zones ??
    root?.items ??
    root?.content ??
    root;

  if (!Array.isArray(list)) return [];
  return list.map(normalizeBeaconZone).filter(Boolean);
}

export function loadBeaconZonesFromLocalStorage() {
  if (typeof window === "undefined") return DEFAULT_BEACON_ZONES;
  try {
    const raw = window.localStorage.getItem(BEACON_ZONES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const zones = normalizeBeaconZones(parsed);
    return zones.length ? zones : DEFAULT_BEACON_ZONES;
  } catch {
    return DEFAULT_BEACON_ZONES;
  }
}

export function saveBeaconZonesToLocalStorage(zones) {
  if (typeof window === "undefined") return;
  const normalized = normalizeBeaconZones(zones);
  try {
    window.localStorage.setItem(BEACON_ZONES_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(BEACON_ZONES_EVENT, { detail: normalized }));
  } catch {
    // ignore
  }
}

export async function fetchBeaconZones() {
  if (isDevTestAuthToken()) return loadBeaconZonesFromLocalStorage();

  const res = await apiClient.get("/api/v1/beacon-zones", {
    skipAuthRedirect: true
  });
  const zones = normalizeBeaconZones(res?.data);
  if (zones.length) saveBeaconZonesToLocalStorage(zones);
  return zones;
}

export async function createBeaconZone(zone) {
  const normalized = normalizeBeaconZone(zone);
  if (!normalized) return null;
  if (isDevTestAuthToken()) return normalized;

  const res = await apiClient.post(
    "/api/v1/beacon-zones",
    {
      id: normalized.id,
      beaconId: normalized.id,
      name: normalized.name,
      beaconName: normalized.name,
      zoneName: normalized.name,
      capacity: normalized.capacity
    },
    {
      skipAuthRedirect: true
    }
  );
  return normalizeBeaconZone(res?.data?.data ?? res?.data) ?? normalized;
}

export async function updateBeaconZone(previousId, zone) {
  const normalized = normalizeBeaconZone(zone);
  if (!normalized) return null;
  if (isDevTestAuthToken()) return normalized;

  const res = await apiClient.put(
    `/api/v1/beacon-zones/${encodeURIComponent(previousId)}`,
    {
      id: normalized.id,
      beaconId: normalized.id,
      name: normalized.name,
      beaconName: normalized.name,
      zoneName: normalized.name,
      capacity: normalized.capacity
    },
    {
      skipAuthRedirect: true
    }
  );
  return normalizeBeaconZone(res?.data?.data ?? res?.data) ?? normalized;
}

export async function deleteBeaconZoneById(zoneId) {
  if (isDevTestAuthToken()) return { ok: true };

  const res = await apiClient.delete(`/api/v1/beacon-zones/${encodeURIComponent(zoneId)}`, {
    skipAuthRedirect: true
  });
  return res?.data;
}
