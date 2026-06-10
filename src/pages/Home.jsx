import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  BedDouble,
  CheckCircle,
  Dumbbell,
  Pencil,
  RadioTower,
  RefreshCw,
  X,
  Zap
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "@/api/client";
import {
  checkInAttendance,
  fetchAttendance,
  fetchRecentCongestion,
  normalizeAttendanceRecords,
  updateCurrentLocation
} from "@/api/attendance";
import {
  AUTO_ATTENDANCE_EVENT,
  fetchAutoAttendanceEnabled,
  isAutoAttendanceEnabled,
  saveAutoAttendanceEnabled,
  updateAutoAttendanceEnabled
} from "@/api/autoAttendance";
import {
  BEACON_ZONES_EVENT,
  fetchBeaconZones,
  loadBeaconZonesFromLocalStorage
} from "@/api/beaconZones";
import {
  fetchRoutines,
  loadRoutineRestDaysFromLocalStorage,
  loadRoutinesFromLocalStorage
} from "@/api/routines";
import {
  WORKOUT_HISTORY_EVENT,
  getWorkoutHistoryStorageKey,
  loadWorkoutHistoryFromLocalStorage,
  replaceWorkoutDay
} from "@/api/workouts";
import { fetchMyProfile, isCurrentAccountProfile } from "@/api/profile";
import {
  PROFILE_NAME_CHANGED_EVENT,
  getAuthProfileName,
  getStoredAuthIdentity,
  hasUserEditedProfileName,
  isSocialAuthSession,
  setStoredProfileName
} from "@/auth/auth";
import { startNativeWorkout } from "@/native/androidBridge";

const GYM_NAME_STORAGE_KEY = "moduflow:gym-name:v1";
const BEACON_ATTENDANCE_STORAGE_PREFIX = "moduflow:beacon-attendance:v1";
const DEFAULT_GYM_NAME = "ModuFlow";
const DAY_LABELS = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일"
};
const EXERCISE_NAME_TO_ID = {
  squat: "squat",
  "스쿼트": "squat",
  pushup: "pushup",
  "푸쉬업": "pushup",
  "푸시업": "pushup",
  lunge: "lunge",
  "런지": "lunge",
  plank: "plank",
  "플랭크": "plank"
};
const BEACON_CONGESTION_SLOTS = [
  { id: "beacon-slot-1", title: "비콘 ID 없음" },
  { id: "beacon-slot-2", title: "비콘 ID 없음" },
  { id: "beacon-slot-3", title: "비콘 ID 없음" }
];

function dayKeyFromDate(date) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[date.getDay()];
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeWorkoutName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function getWorkoutItemMatchKeys(item) {
  const keys = [];
  const exerciseId = String(item?.exerciseId || "").trim();
  const name = normalizeWorkoutName(item?.name);
  if (exerciseId) keys.push(`exercise:${exerciseId}`);
  if (name) keys.push(`name:${name}`);
  return keys;
}

function workoutItemsMatch(a, b) {
  const aKeys = getWorkoutItemMatchKeys(a);
  const bKeys = new Set(getWorkoutItemMatchKeys(b));
  return aKeys.some((key) => bKeys.has(key));
}

function hasSavedAllRoutineItemsForDate(date, routineItems) {
  if (!Array.isArray(routineItems) || !routineItems.length) return false;
  if (typeof window === "undefined") return false;
  try {
    const parsed = loadWorkoutHistoryFromLocalStorage();
    const savedItems = Array.isArray(parsed?.[date]) ? parsed[date] : [];
    const usedSavedIndexes = new Set();

    return routineItems.every((routineItem) => {
      const matchIndex = savedItems.findIndex(
        (savedItem, idx) =>
          !usedSavedIndexes.has(idx) && workoutItemsMatch(routineItem, savedItem)
      );
      if (matchIndex < 0) return false;
      usedSavedIndexes.add(matchIndex);
      return true;
    });
  } catch {
    return false;
  }
}

function getBeaconAttendanceStorageKey(gymName = resolveGymName()) {
  const identity = getStoredAuthIdentity() || "anonymous";
  return [
    BEACON_ATTENDANCE_STORAGE_PREFIX,
    encodeURIComponent(identity),
    encodeURIComponent(resolveGymName({ gymName }))
  ].join(":");
}

function readBeaconAttendanceDate(gymName = resolveGymName()) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(getBeaconAttendanceStorageKey(gymName)) || "";
  } catch {
    return "";
  }
}

function markBeaconAttendanceDate(date, gymName = resolveGymName()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getBeaconAttendanceStorageKey(gymName), date);
  } catch {
    // ignore
  }
}

async function hasAttendanceForDate(date, gymName) {
  const data = await fetchAttendance({ gymName });
  return normalizeAttendanceRecords(data).some(
    (record) => {
      const checkInAt = new Date(record.checkInAt);
      return !Number.isNaN(checkInAt.getTime()) && formatDate(checkInAt) === date;
    }
  );
}

function readStoredGymName() {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("gymName");
    if (fromQuery?.trim()) {
      window.localStorage.setItem(GYM_NAME_STORAGE_KEY, fromQuery.trim());
      return fromQuery.trim();
    }
  } catch {
    // ignore
  }

  try {
    return window.localStorage.getItem(GYM_NAME_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

function resolveGymName(source) {
  const gymName =
    source?.gymName ??
    source?.gym?.name ??
    source?.gymId ??
    (typeof window === "undefined"
      ? ""
      : window.__MODUFLOW_GYM_NAME__ ?? window.__MODUFLOW_CONFIG__?.gymName) ??
    readStoredGymName() ??
    import.meta.env.VITE_GYM_NAME ??
    DEFAULT_GYM_NAME;

  return String(gymName || "").trim() || DEFAULT_GYM_NAME;
}

function resolveExerciseId(name) {
  if (typeof name !== "string") return null;
  return EXERCISE_NAME_TO_ID[name.trim().toLowerCase()] || null;
}

function resolveRoutineExerciseId(item) {
  if (typeof item?.exerciseId === "string" && item.exerciseId.trim()) {
    return item.exerciseId.trim();
  }
  return resolveExerciseId(item?.name);
}

function normalizeRoutinesByDay(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = Object.create(null);
  for (const [dayKey, list] of Object.entries(raw)) {
    if (!Object.prototype.hasOwnProperty.call(DAY_LABELS, dayKey)) continue;
    if (!Array.isArray(list)) continue;
    out[dayKey] = list.filter((it) => it && typeof it === "object");
  }
  return out;
}

function readNumeric(value) {
  if (typeof value === "string") {
    const n = Number(value.trim().replace(/%$/, ""));
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCongestionLevel(value, metric = "level") {
  if (typeof value === "string") {
    const key = value.trim().toLowerCase();
    if (["low", "idle", "free", "easy", "여유", "원활"].includes(key)) {
      return "low";
    }
    if (["mid", "medium", "normal", "moderate", "보통"].includes(key)) {
      return "mid";
    }
    if (["high", "busy", "crowded", "congested", "혼잡", "매우혼잡"].includes(key)) {
      return "high";
    }
  }

  const numericValue = readNumeric(value);
  if (numericValue == null) return null;
  if (metric === "percent" || metric === "percentage" || metric === "rate") {
    const percent = numericValue <= 1 ? numericValue * 100 : numericValue;
    if (percent > 100 * (2 / 3)) return "high";
    if (percent > 100 * (1 / 3)) return "mid";
    return "low";
  }
  if (numericValue >= 2) return "high";
  if (numericValue >= 1) return "mid";
  return "low";
}

function pickFirstValue(...values) {
  return values.find((value) => value != null && !Array.isArray(value));
}

function findZoneCongestion(data, keywords) {
  if (!data || typeof data !== "object") return null;

  const direct = pickFirstValue(
    ...keywords.flatMap((keyword) => [
      data[keyword],
      data[`${keyword}Zone`],
      data[`${keyword}Congestion`],
      data[`${keyword}CongestionLevel`],
      data.zones?.[keyword],
      data.zoneCongestion?.[keyword],
      data.congestion?.[keyword]
    ])
  );
  if (direct != null) return direct;

  const lists = [data.zones, data.zoneCongestion, data.congestion, data.items, data];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    const match = list.find((item) => {
      if (!item || typeof item !== "object") return false;
      const label = String(
        item.zone ?? item.zoneName ?? item.zoneId ?? item.name ?? item.type ?? ""
      ).toLowerCase();
      return keywords.some((keyword) => label.includes(keyword));
    });
    if (match) return match;
  }

  return null;
}

function getBeaconIdentity(item) {
  if (!item || typeof item !== "object") return null;
  const value =
    item.beaconId ??
    item.zoneId ??
    item.minor ??
    item.id ??
    item.uuid ??
    item.name ??
    item.zoneName ??
    item.beaconName;
  if (value == null || value === "") return null;
  return String(value).trim();
}

function getBeaconCount(item) {
  if (!item || typeof item !== "object") return null;
  return readNumeric(
    item.currentCount ??
      item.current_count ??
      item.peopleCount ??
      item.people_count ??
      item.userCount ??
      item.user_count ??
      item.current ??
      item.count ??
      item.population ??
      item.memberCount ??
      item.member_count
  );
}

function getBeaconCapacity(item, zoneConfig) {
  const configuredCapacity = readNumeric(zoneConfig?.capacity);
  if (configuredCapacity != null && configuredCapacity > 0) return configuredCapacity;
  if (!item || typeof item !== "object") return null;
  return (
    readNumeric(
      item.capacity ??
        item.maxCapacity ??
        item.max_capacity ??
        item.limit ??
        item.acceptableCapacity ??
        item.acceptable_capacity ??
        item.totalCapacity ??
        item.total_capacity
    ) ?? null
  );
}

function getBeaconOccupancyRate(item, zoneConfig) {
  if (!item || typeof item !== "object") return null;
  const count = getBeaconCount(item);
  const capacity = getBeaconCapacity(item, zoneConfig);
  if (count != null && capacity != null && capacity > 0) {
    return Math.max(0, Math.min(100, (count / capacity) * 100));
  }

  const explicitRate = readNumeric(
    item.percent ??
      item.percentage ??
      item.occupancy ??
      item.congestionRate ??
      item.congestion_rate ??
      item.rate
  );
  if (explicitRate == null) return null;
  return Math.max(0, Math.min(100, explicitRate <= 1 ? explicitRate * 100 : explicitRate));
}

function normalizeCongestionByCapacity(count, capacity) {
  if (count == null || capacity == null || capacity <= 0) return null;
  const ratio = count / capacity;
  if (ratio > 2 / 3) return "high";
  if (ratio > 1 / 3) return "mid";
  return "low";
}

function createBeaconZoneLookup(beaconZones) {
  const map = new Map();
  for (const zone of beaconZones || []) {
    if (!zone || typeof zone !== "object") continue;
    for (const key of [zone.id, zone.beaconId, zone.zoneId, zone.name, zone.zoneName]) {
      if (key == null || key === "") continue;
      map.set(normalizeBeaconKey(key), zone);
    }
  }
  return map;
}

function normalizeBeaconKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function findBeaconZoneConfig(item, lookup) {
  if (!item || !lookup) return null;
  const keys = [
    item.beaconId,
    item.beacon_id,
    item.zoneId,
    item.zone_id,
    item.zoneCode,
    item.zone_code,
    item.minor,
    item.id,
    item.uuid,
    item.name,
    item.zoneName,
    item.zone_name,
    item.beaconName,
    item.beacon_name
  ];
  for (const key of keys) {
    if (key == null || key === "") continue;
    const match = lookup.get(normalizeBeaconKey(key));
    if (match) return match;
  }
  return null;
}

function normalizeZoneCongestion(zoneData, zoneConfig = null) {
  if (zoneData == null) return null;
  if (typeof zoneData !== "object") return normalizeCongestionLevel(zoneData);
  const capacityLevel = normalizeCongestionByCapacity(
    getBeaconCount(zoneData),
    getBeaconCapacity(zoneData, zoneConfig)
  );
  if (capacityLevel) return capacityLevel;
  if (zoneData.congestionStatus != null) {
    return normalizeCongestionLevel(zoneData.congestionStatus);
  }
  if (zoneData.congestion_status != null) {
    return normalizeCongestionLevel(zoneData.congestion_status);
  }
  if (zoneData.congestionRate != null) {
    return normalizeCongestionLevel(zoneData.congestionRate, "rate");
  }
  if (zoneData.congestion_rate != null) {
    return normalizeCongestionLevel(zoneData.congestion_rate, "rate");
  }
  if (zoneData.occupancy != null) {
    return normalizeCongestionLevel(zoneData.occupancy, "rate");
  }
  if (zoneData.currentCount != null) return normalizeCongestionLevel(zoneData.currentCount);
  if (zoneData.peopleCount != null) return normalizeCongestionLevel(zoneData.peopleCount);
  if (zoneData.userCount != null) return normalizeCongestionLevel(zoneData.userCount);
  if (zoneData.level != null) return normalizeCongestionLevel(zoneData.level);
  if (zoneData.status != null) return normalizeCongestionLevel(zoneData.status);
  if (zoneData.congestionLevel != null) {
    return normalizeCongestionLevel(zoneData.congestionLevel);
  }
  if (zoneData.congestion_level != null) {
    return normalizeCongestionLevel(zoneData.congestion_level);
  }
  if (zoneData.congestion != null) return normalizeCongestionLevel(zoneData.congestion);
  if (zoneData.percent != null) return normalizeCongestionLevel(zoneData.percent, "percent");
  if (zoneData.percentage != null) {
    return normalizeCongestionLevel(zoneData.percentage, "percentage");
  }
  if (zoneData.rate != null) return normalizeCongestionLevel(zoneData.rate, "rate");
  return normalizeCongestionLevel(
    zoneData.count
  );
}

function normalizeFallbackCongestion(root) {
  if (root == null) return null;
  if (typeof root !== "object") return normalizeCongestionLevel(root);
  if (root.level != null) return normalizeCongestionLevel(root.level);
  if (root.status != null) return normalizeCongestionLevel(root.status);
  if (root.percent != null) return normalizeCongestionLevel(root.percent, "percent");
  if (root.percentage != null) {
    return normalizeCongestionLevel(root.percentage, "percentage");
  }
  if (root.rate != null) return normalizeCongestionLevel(root.rate, "rate");
  return normalizeCongestionLevel(root.count);
}

function getBeaconTitle(item, index, zoneConfig = null) {
  if (zoneConfig?.name) return zoneConfig.name;
  if (!item || typeof item !== "object") return BEACON_CONGESTION_SLOTS[index].title;
  const label =
    item.name ??
    item.beaconName ??
    item.zoneName ??
    item.beaconId ??
    item.zoneId ??
    item.minor ??
    item.id;
  if (label == null || label === "") return BEACON_CONGESTION_SLOTS[index].title;
  return String(label);
}

function createBeaconCongestionSlots(status = "no-signal", level = null, beaconZones = []) {
  return BEACON_CONGESTION_SLOTS.map((slot, index) => ({
    ...slot,
    id: beaconZones[index]?.id ?? slot.id,
    title: beaconZones[index]?.name ?? slot.title,
    current: null,
    capacity: beaconZones[index]?.capacity ?? null,
    rate: null,
    level,
    status
  }));
}

function createNativeBeaconSignalSlots(payload, status = "signal-api-error", beaconZones = []) {
  const slots = createBeaconCongestionSlots("no-signal", null, beaconZones);
  const zoneConfig = findBeaconZoneConfig(payload, createBeaconZoneLookup(beaconZones));
  const beaconLabel =
    zoneConfig?.name ??
    payload?.beaconId ??
    payload?.zoneId ??
    payload?.minor ??
    payload?.id ??
    payload?.beaconName ??
    payload?.zoneName;
  slots[0] = {
    ...slots[0],
    title: beaconLabel == null ? "비콘 ID 없음" : String(beaconLabel),
    status
  };
  return slots;
}

function getDetailedApiErrorMessage(error, fallback = "정보를 불러오지 못했어요.") {
  return getApiErrorMessage(error, fallback);
}

function getCongestionEntries(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "object") return [];
  return Object.entries(value).map(([key, item]) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return { name: key, ...item };
    }
    return { name: key, level: item };
  });
}

function getBeaconCongestionItems(root) {
  if (!root || typeof root !== "object") return [];
  const lists = [
    root.beacons,
    root.beaconCongestion,
    root.beacon_congestion,
    root.zones,
    root.zoneCongestion,
    root.zone_congestion,
    root.congestionByZone,
    root.congestion_by_zone,
    root.zoneCounts,
    root.zone_counts,
    root.congestion,
    root.items,
    root.content,
    Array.isArray(root) ? root : null
  ];
  return lists.flatMap(getCongestionEntries).slice(0, BEACON_CONGESTION_SLOTS.length);
}

function normalizeHomeCongestion(data, beaconZones = []) {
  let root = data;
  const visited = new Set();
  while (
    root &&
    typeof root === "object" &&
    !Array.isArray(root) &&
    !visited.has(root)
  ) {
    visited.add(root);
    const nested = root.data ?? root.result ?? root.payload;
    if (!nested || typeof nested !== "object") break;
    root = nested;
  }
  const cardio = findZoneCongestion(root, ["cardio", "aerobic", "유산소"]);
  const weight = findZoneCongestion(root, ["weight", "weights", "free-weight", "웨이트", "근력"]);
  const cardioLevel = normalizeZoneCongestion(cardio);
  const weightLevel = normalizeZoneCongestion(weight);
  const fallbackLevel = normalizeFallbackCongestion(root);
  const beaconItems = getBeaconCongestionItems(root);
  const beaconZoneLookup = createBeaconZoneLookup(beaconZones);
  const isSingleNearestBeaconLevel = beaconItems.length === 0 && fallbackLevel != null;
  const beacons = BEACON_CONGESTION_SLOTS.map((slot, index) => {
    const item = beaconItems[index];
    const zoneConfig =
      findBeaconZoneConfig(item, beaconZoneLookup) ??
      beaconZones[index] ??
      null;
    const level = normalizeZoneCongestion(item, zoneConfig);
    const current = getBeaconCount(item);
    const capacity = getBeaconCapacity(item, zoneConfig);
    const rate = getBeaconOccupancyRate(item, zoneConfig);
    const hasSignal = level != null || (isSingleNearestBeaconLevel && index === 0);
    return {
      id: zoneConfig?.id ?? getBeaconIdentity(item) ?? slot.id,
      title:
        isSingleNearestBeaconLevel && index === 0
          ? zoneConfig?.name ?? "비콘 ID 없음"
          : getBeaconTitle(item, index, zoneConfig),
      current,
      capacity,
      rate,
      level: level ?? (index === 0 ? fallbackLevel : null),
      status: hasSignal ? "ok" : "no-signal"
    };
  });
  const hasBeaconSignal = beacons.some((beacon) => beacon.status === "ok");
  const hasZoneBreakdown = cardioLevel != null || weightLevel != null || hasBeaconSignal;
  const hasCongestionSignal = hasZoneBreakdown || fallbackLevel != null;

  return {
    cardio: cardioLevel ?? fallbackLevel,
    weight: weightLevel ?? fallbackLevel,
    overall: fallbackLevel ?? cardioLevel ?? weightLevel,
    beacons,
    hasZoneBreakdown,
    status: hasCongestionSignal ? "ok" : "no-signal",
    updatedAt:
      cardio?.occurredAt ??
      weight?.occurredAt ??
      root?.occurredAt ??
      root?.updatedAt ??
      root?.createdAt ??
      null
  };
}

function formatCongestionUpdatedAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function getNativeLocationPayload(detail) {
  if (!detail || typeof detail !== "object") return null;
  const userId =
    detail.userId ??
    detail.user_id ??
    detail.androidId ??
    detail.android_id ??
    detail.deviceId ??
    detail.device_id;
  const zoneId =
    detail.zoneId ??
    detail.zone_id ??
    detail.beaconId ??
    detail.beacon_id ??
    detail.minor ??
    detail.beaconMinor ??
    detail.zoneCode ??
    detail.zone_code;
  if (userId == null || zoneId == null) return null;

  return {
    ...detail,
    userId,
    zoneId,
    gymName: resolveGymName(detail)
  };
}

function hasNativeBeaconSignal(detail) {
  if (!detail || typeof detail !== "object") return false;
  const zoneId =
    detail.zoneId ??
    detail.zone_id ??
    detail.beaconId ??
    detail.beacon_id ??
    detail.minor ??
    detail.beaconMinor ??
    detail.zoneCode ??
    detail.zone_code;
  if (zoneId != null && zoneId !== "") return true;

  const beacons = detail.beacons ?? detail.beaconCongestion ?? detail.zones;
  return Array.isArray(beacons) && beacons.length > 0;
}

function normalizeNativeEventDetail(value) {
  let root = value;
  if (typeof root === "string") {
    try {
      root = JSON.parse(root);
    } catch {
      return null;
    }
  }
  if (!root || typeof root !== "object") return root;

  let nested = root.payload ?? root.detail ?? root.data;
  if (typeof nested === "string") {
    try {
      nested = JSON.parse(nested);
    } catch {
      nested = null;
    }
  }
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) return root;

  return {
    ...root,
    ...nested,
    type: root.type ?? nested.type
  };
}

function isNativeAttendanceEvent(detail) {
  if (!detail || typeof detail !== "object") return false;
  const type = String(detail.type ?? detail.event ?? "").trim().toLowerCase();
  const source = String(detail.source ?? "").trim().toLowerCase();
  if (
    ![
      "attendance",
      "check-in",
      "checkin",
      "beacon",
      "beacon-detected",
      "beacon_detected",
      "location",
      "proximity"
    ].includes(type) &&
    source !== "beacon"
  ) {
    return false;
  }
  return detail.checkedIn !== false;
}

function CongestionPill({ level, title, current, rate, loading, status }) {
  const map = {
    low: {
      label: "여유"
    },
    mid: {
      label: "보통"
    },
    high: {
      label: "혼잡"
    }
  };

  const ui = map[level] ?? map.low;
  const statusLabel =
    status === "error"
      ? "확인할 수 없음"
      : status === "signal-api-error"
        ? "연결 확인 필요"
        : status === "signal-received"
          ? "신호 수신"
          : status === "no-signal"
            ? "신호 없음"
            : ui.label;
  const hideBar =
    loading ||
    status === "error" ||
    status === "signal-api-error" ||
    status === "signal-received" ||
    status === "no-signal" ||
    rate == null;
  const barColor =
    level === "high"
      ? "bg-[color:var(--c-level-high)]"
      : level === "mid"
        ? "bg-[color:var(--c-level-mid)]"
        : "bg-[color:var(--c-level-low)]";
  const countLabel = current == null ? null : `${Math.round(current)}명`;

  return (
    <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-primary-soft)] px-4 py-3 transition-[background-color,border-color] duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-[color:var(--c-text)]">
            {title}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-[color:var(--c-muted-2)]">
            혼잡도 · {loading ? "확인 중" : statusLabel}
          </p>
        </div>
        {!loading && status === "ok" && countLabel ? (
          <span className="shrink-0 text-sm font-extrabold text-[color:var(--c-text)]">
            {countLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[color:var(--c-surface)]">
        <div
          className={`h-full rounded-full ${hideBar ? "bg-transparent" : barColor}`}
          style={{ width: hideBar ? "0%" : `${rate}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(() => getAuthProfileName());
  const todayDayKey = useMemo(() => dayKeyFromDate(new Date()), []);
  const todayDate = useMemo(() => formatDate(new Date()), []);
  const [startNotice, setStartNotice] = useState(null);
  const [attendanceToast, setAttendanceToast] = useState(null);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [checkingInAttendance, setCheckingInAttendance] = useState(false);
  const attendanceRequestDateRef = useRef(null);
  const [autoAttendanceEnabled, setAutoAttendanceEnabled] = useState(() =>
    isAutoAttendanceEnabled()
  );
  const [beaconAttendanceDate, setBeaconAttendanceDate] = useState(() =>
    readBeaconAttendanceDate(resolveGymName())
  );
  const [workoutSavedToday, setWorkoutSavedToday] = useState(false);
  const [showRoutineOptions, setShowRoutineOptions] = useState(false);
  const [beaconZones, setBeaconZones] = useState(() => loadBeaconZonesFromLocalStorage());
  const [congestion, setCongestion] = useState({
    cardio: null,
    weight: null,
    overall: null,
    beacons: createBeaconCongestionSlots("loading", null, beaconZones),
    hasZoneBreakdown: false,
    status: "loading",
    updatedAt: null,
    loading: true,
    error: null
  });
  const [routinesByDay, setRoutinesByDay] = useState(() =>
    normalizeRoutinesByDay(loadRoutinesFromLocalStorage())
  );
  const [restDays, setRestDays] = useState(() => loadRoutineRestDaysFromLocalStorage());
  const isAttendanceCompletedToday = beaconAttendanceDate === todayDate;
  const attendance = {
    status: isAttendanceCompletedToday
      ? "출석 완료"
      : checkingInAttendance
        ? "출석 처리 중"
        : autoAttendanceEnabled
          ? "비콘 대기"
          : "자동출석 꺼짐",
    description: isAttendanceCompletedToday
      ? "오늘 출석 완료"
      : autoAttendanceEnabled
        ? "비콘 신호 수신 시 출석"
        : "관리자 설정에서 켤 수 있어요"
  };
  const isTodayRestDay = restDays.includes(todayDayKey);
  const hasAnyRoutine = useMemo(() => {
    return Object.values(routinesByDay || {}).some(
      (list) => Array.isArray(list) && list.length > 0
    );
  }, [routinesByDay]);
  const todayRoutines = useMemo(() => {
    if (isTodayRestDay) return [];
    const list = routinesByDay?.[todayDayKey];
    return Array.isArray(list) ? list : [];
  }, [isTodayRestDay, routinesByDay, todayDayKey]);
  const todayExerciseIds = useMemo(() => {
    return todayRoutines.map(resolveRoutineExerciseId).filter(Boolean);
  }, [todayRoutines]);
  const workoutHistoryStorageKey = getWorkoutHistoryStorageKey();

  useEffect(() => {
    let active = true;

    async function syncProfileName() {
      try {
        const profile = await fetchMyProfile();
        if (
          !active ||
          !profile?.name ||
          !isCurrentAccountProfile(profile) ||
          (isSocialAuthSession() && !hasUserEditedProfileName())
        ) return;
        setStoredProfileName(profile.name);
        setUserName(profile.name);
      } catch (e) {
        if (active) setUserName(getAuthProfileName());
      }
    }

    function syncStoredProfileName(event) {
      const nextName = String(event?.detail?.name || getAuthProfileName()).trim();
      setUserName(nextName || getAuthProfileName());
    }

    syncProfileName();
    window.addEventListener("focus", syncProfileName);
    window.addEventListener(PROFILE_NAME_CHANGED_EVENT, syncStoredProfileName);
    return () => {
      active = false;
      window.removeEventListener("focus", syncProfileName);
      window.removeEventListener(PROFILE_NAME_CHANGED_EVENT, syncStoredProfileName);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function syncRoutines() {
      try {
        const serverData = await fetchRoutines();
        if (cancelled) return;
        setRoutinesByDay(normalizeRoutinesByDay(serverData));
        if (Array.isArray(serverData?.restDays)) {
          setRestDays(serverData.restDays);
        }
      } catch (e) {
      }
    }
    function syncRestDays() {
      setRestDays(loadRoutineRestDaysFromLocalStorage());
    }

    syncRoutines();
    window.addEventListener("focus", syncRoutines);
    window.addEventListener("storage", syncRestDays);
    window.addEventListener("moduflow:routine-rest-days", syncRestDays);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", syncRoutines);
      window.removeEventListener("storage", syncRestDays);
      window.removeEventListener("moduflow:routine-rest-days", syncRestDays);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    function syncWorkoutSavedToday() {
      setWorkoutSavedToday(hasSavedAllRoutineItemsForDate(todayDate, todayRoutines));
    }
    syncWorkoutSavedToday();
    window.addEventListener("focus", syncWorkoutSavedToday);
    window.addEventListener("storage", syncWorkoutSavedToday);
    window.addEventListener(WORKOUT_HISTORY_EVENT, syncWorkoutSavedToday);
    return () => {
      window.removeEventListener("focus", syncWorkoutSavedToday);
      window.removeEventListener("storage", syncWorkoutSavedToday);
      window.removeEventListener(WORKOUT_HISTORY_EVENT, syncWorkoutSavedToday);
    };
  }, [todayDate, todayRoutines, workoutHistoryStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let active = true;

    async function syncBeaconZones() {
      try {
        const zones = await fetchBeaconZones();
        if (!active) return;
        if (zones.length) setBeaconZones(zones);
      } catch (e) {
        if (active) setBeaconZones(loadBeaconZonesFromLocalStorage());
      }
    }

    function syncStoredBeaconZones(event) {
      const next = Array.isArray(event?.detail)
        ? event.detail
        : loadBeaconZonesFromLocalStorage();
      setBeaconZones(next);
    }

    syncBeaconZones();
    window.addEventListener("focus", syncBeaconZones);
    window.addEventListener("storage", syncStoredBeaconZones);
    window.addEventListener(BEACON_ZONES_EVENT, syncStoredBeaconZones);
    return () => {
      active = false;
      window.removeEventListener("focus", syncBeaconZones);
      window.removeEventListener("storage", syncStoredBeaconZones);
      window.removeEventListener(BEACON_ZONES_EVENT, syncStoredBeaconZones);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let active = true;

    async function syncServerAutoAttendance() {
      try {
        const enabled = await fetchAutoAttendanceEnabled();
        if (active) setAutoAttendanceEnabled(saveAutoAttendanceEnabled(enabled));
      } catch (e) {
      }
    }

    function syncAutoAttendance(event) {
      setAutoAttendanceEnabled(
        typeof event?.detail === "boolean" ? event.detail : isAutoAttendanceEnabled()
      );
    }
    syncServerAutoAttendance();
    window.addEventListener("storage", syncAutoAttendance);
    window.addEventListener(AUTO_ATTENDANCE_EVENT, syncAutoAttendance);
    return () => {
      active = false;
      window.removeEventListener("storage", syncAutoAttendance);
      window.removeEventListener(AUTO_ATTENDANCE_EVENT, syncAutoAttendance);
    };
  }, []);

  const syncCongestion = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setCongestion((prev) => ({ ...prev, loading: true, error: null }));
    }
    try {
      const data = await fetchRecentCongestion({ gymName: resolveGymName() });
      setCongestion({
        ...normalizeHomeCongestion(data, beaconZones),
        loading: false,
        error: null
      });
    } catch (e) {
      setCongestion((prev) => ({
        ...prev,
        beacons: createBeaconCongestionSlots("error", null, beaconZones),
        hasZoneBreakdown: false,
        status: "error",
        loading: false,
        error: getDetailedApiErrorMessage(e)
      }));
    }
  }, [beaconZones]);

  useEffect(() => {
    let active = true;

    function syncIfActive(options) {
      if (!active) return;
      syncCongestion(options);
    }

    syncIfActive();
    const timer = window.setInterval(() => syncIfActive({ silent: true }), 60_000);
    window.addEventListener("focus", syncIfActive);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", syncIfActive);
    };
  }, [syncCongestion]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let active = true;

    async function handleNativeEvent(event) {
      const detail = normalizeNativeEventDetail(event?.detail);
      if (String(detail?.type ?? "").toLowerCase() === "congestion") {
        setCongestion({
          ...normalizeHomeCongestion(detail, beaconZones),
          loading: false,
          error: null
        });
      }

      const locationPayload = getNativeLocationPayload(detail);
      const shouldCheckIn =
        isNativeAttendanceEvent(detail) || hasNativeBeaconSignal(detail);
      if (!shouldCheckIn) return;

      if (locationPayload) {
        setCongestion((prev) => ({
          ...prev,
          beacons: createNativeBeaconSignalSlots(
            locationPayload,
            "signal-received",
            beaconZones
          ),
          hasZoneBreakdown: true,
          status: "ok",
          loading: false,
          error: null
        }));
      }

      try {
        const attendanceDate = formatDate(new Date());
        const gymName = resolveGymName(locationPayload ?? detail);
        let locationUpdated = false;

        if (locationPayload) {
          try {
            await updateCurrentLocation(locationPayload);
            locationUpdated = true;
          } catch (locationError) {
          }
        }

        if (
          autoAttendanceEnabled &&
          readBeaconAttendanceDate(gymName) !== attendanceDate &&
          attendanceRequestDateRef.current !== attendanceDate
        ) {
          attendanceRequestDateRef.current = attendanceDate;
          setCheckingInAttendance(true);
          try {
            let attendanceExists =
              locationUpdated &&
              (await hasAttendanceForDate(attendanceDate, gymName));

            if (!attendanceExists) {
              try {
                await checkInAttendance({ gymName });
                attendanceExists = true;
              } catch (attendanceError) {
                attendanceExists = await hasAttendanceForDate(attendanceDate, gymName);
                if (!attendanceExists) throw attendanceError;
              }
            }

            markBeaconAttendanceDate(attendanceDate, gymName);
            if (active) {
              setBeaconAttendanceDate(attendanceDate);
              setAttendanceToast({
                title: "출석 완료",
                message: "비콘 신호가 확인되어 오늘 출석이 처리되었습니다."
              });
            }
          } catch (attendanceError) {
            if (active) {
              setStartNotice(
                getApiErrorMessage(attendanceError, "비콘 출석 처리에 실패했어요.")
              );
            }
          } finally {
            if (active) setCheckingInAttendance(false);
            if (attendanceRequestDateRef.current === attendanceDate) {
              attendanceRequestDateRef.current = null;
            }
          }
        }

        if (!locationPayload) return;

        const data = await fetchRecentCongestion({
          gymName: resolveGymName(locationPayload)
        });
        if (!active) return;
        setCongestion({
          ...normalizeHomeCongestion(data, beaconZones),
          loading: false,
          error: null
        });
      } catch (e) {
        if (!active) return;
        setCongestion((prev) => ({
          ...prev,
          beacons: createNativeBeaconSignalSlots(
            locationPayload,
            "signal-api-error",
            beaconZones
          ),
          hasZoneBreakdown: false,
          status: "error",
          loading: false,
          error: getDetailedApiErrorMessage(e)
        }));
      }
    }

    window.addEventListener("moduflow:native-event", handleNativeEvent);
    return () => {
      active = false;
      window.removeEventListener("moduflow:native-event", handleNativeEvent);
    };
  }, [autoAttendanceEnabled, beaconZones]);

  useEffect(() => {
    if (!startNotice) return;
    const t = window.setTimeout(() => setStartNotice(null), 2200);
    return () => window.clearTimeout(t);
  }, [startNotice]);

  useEffect(() => {
    if (!attendanceToast) return;
    const t = window.setTimeout(() => setAttendanceToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [attendanceToast]);

  function goToManualRoutineAdd() {
    setShowRoutineOptions(false);
    navigate("/mypage/routines");
  }

  function goToWorkoutSelection() {
    setShowRoutineOptions(false);
    navigate("/workout");
  }

  async function toggleAutoAttendance() {
    const previous = autoAttendanceEnabled;
    const next = saveAutoAttendanceEnabled(!previous);
    setAutoAttendanceEnabled(next);
    try {
      await updateAutoAttendanceEnabled(next);
    } catch (e) {
      saveAutoAttendanceEnabled(previous);
      setAutoAttendanceEnabled(previous);
      setStartNotice(getApiErrorMessage(e, "자동출석 설정 저장에 실패했어요."));
    }
  }

  async function completeTodayWorkout() {
    if (savingWorkout) return;
    if (workoutSavedToday) {
      setStartNotice("오늘 운동은 이미 기록되었습니다.");
      return;
    }
    if (isTodayRestDay) {
      setStartNotice("오늘은 쉬는 날로 설정되어 있습니다.");
      return;
    }
    if (!todayRoutines.length) {
      setStartNotice("저장할 오늘 루틴이 없습니다.");
      return;
    }

    setSavingWorkout(true);
    try {
      await replaceWorkoutDay(todayDate, todayRoutines);
      setWorkoutSavedToday(true);
      setStartNotice("오늘 운동이 기록되었습니다.");
      navigate("/stats");
    } catch (e) {
      setStartNotice(getApiErrorMessage(e, "운동 기록 저장에 실패했어요."));
    } finally {
      setSavingWorkout(false);
    }
  }

  return (
    <>
      {attendanceToast ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+1rem)] z-[80] px-4"
          role="status"
          aria-live="polite"
        >
          <div className="mx-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-emerald-500/25 bg-[color:var(--c-surface)] px-4 py-3 shadow-lg">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
              <CheckCircle size={21} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-[color:var(--c-text)]">
                {attendanceToast.title}
              </span>
              <span className="mt-0.5 block text-xs font-semibold text-[color:var(--c-muted)]">
                {attendanceToast.message}
              </span>
            </span>
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[color:var(--c-muted)]">
              좋은 하루예요,
            </p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight">
              {userName}님
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--c-border-strong)] bg-[color:var(--c-primary-soft)] px-3 py-2 shadow-sm">
              <CheckCircle size={15} className="text-[color:var(--c-primary)]" aria-hidden="true" />
              <span className="text-xs font-extrabold text-[color:var(--c-primary)]">
                {attendance.status}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-semibold text-[color:var(--c-muted-2)]">
              {attendance.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={autoAttendanceEnabled}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 py-3 text-left shadow-sm transition hover:bg-[color:var(--c-surface-2)] active:scale-[0.99]"
          onClick={toggleAutoAttendance}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={[
                "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
                autoAttendanceEnabled
                  ? "bg-[color:var(--c-primary-soft)] text-[color:var(--c-primary)]"
                  : "bg-[color:var(--c-surface-2)] text-[color:var(--c-muted)]"
              ].join(" ")}
            >
              <RadioTower size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-[color:var(--c-text)]">
                자동출석
              </span>
              <span className="mt-0.5 block truncate text-xs font-semibold text-[color:var(--c-muted)]">
                {autoAttendanceEnabled
                  ? "비콘 신호를 잡으면 오늘 출석을 자동 처리해요."
                  : "꺼져 있으면 비콘을 잡아도 출석하지 않아요."}
              </span>
            </span>
          </span>
          <span
            className={[
              "relative h-8 w-14 shrink-0 rounded-full border p-1 transition",
              autoAttendanceEnabled
                ? "border-[color:var(--c-primary)] bg-[color:var(--c-primary)]"
                : "border-[color:var(--c-border)] bg-[color:var(--c-surface-2)]"
            ].join(" ")}
          >
            <span
              className={[
                "block h-6 w-6 rounded-full bg-white shadow-sm transition-transform",
                autoAttendanceEnabled ? "translate-x-6" : "translate-x-0"
              ].join(" ")}
            />
          </span>
        </button>

        <Card className="overflow-hidden bg-[linear-gradient(135deg,var(--c-primary-soft),var(--c-surface))] p-0">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[color:var(--c-muted)]">
                  오늘도 한 걸음
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  운동을 시작해볼까요?
                </p>
              </div>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[color:var(--c-border-strong)] bg-white/80 text-[color:var(--c-primary)] shadow-sm dark:bg-white/10">
                <Dumbbell size={21} aria-hidden="true" />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-3">
              <p className="text-xs font-extrabold text-[color:var(--c-muted)]">
                오늘 루틴 ({DAY_LABELS[todayDayKey] || ""})
              </p>
              {isTodayRestDay ? (
                <>
                  <div className="mt-2 rounded-2xl border border-[color:var(--c-primary)]/20 bg-[color:var(--c-primary-soft)] px-3 py-3">
                    <p className="text-sm font-extrabold text-[color:var(--c-primary)]">
                      오늘은 쉬는 날이에요.
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
                      휴식일은 기록 캘린더와 출석률 계산에 반영돼요.
                    </p>
                  </div>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="py-3 text-sm"
                      onClick={() => navigate("/mypage/routines")}
                    >
                      휴식일 수정
                    </Button>
                  </div>
                </>
              ) : todayRoutines.length ? (
                <>
                  <ul className="mt-2 space-y-1.5">
                    {todayRoutines.slice(0, 3).map((it) => (
                      <li
                        key={it.id}
                        className="truncate text-sm font-semibold text-[color:var(--c-text)]"
                      >
                        • {it.name || "운동 이름"} · {it.sets ?? "-"}세트 ·{" "}
                        {it.reps ?? "-"}회
                        {it.weight == null || it.weight === ""
                          ? ""
                          : ` · ${it.weight}kg`}
                      </li>
                    ))}
                    {todayRoutines.length > 3 ? (
                      <li className="text-xs font-semibold text-[color:var(--c-muted-2)]">
                        외 {todayRoutines.length - 3}개
                      </li>
                    ) : null}
                  </ul>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="py-3 text-sm"
                      onClick={() => setShowRoutineOptions(true)}
                    >
                      루틴 추가
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="py-3 text-sm"
                      onClick={() => navigate("/mypage/routines")}
                    >
                      루틴 수정
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-xs font-semibold text-[color:var(--c-muted-2)]">
                    {hasAnyRoutine
                      ? "오늘은 루틴이 없어요. 마이페이지에서 루틴을 수정해 주세요."
                      : "설정된 루틴이 없어요. 마이페이지에서 루틴을 추가해 주세요."}
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="py-3 text-sm"
                      onClick={() => setShowRoutineOptions(true)}
                    >
                      루틴 추가하기
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4">
              <Button
                type="button"
                className="gap-2 py-5 text-lg"
                onClick={() => {
                  if (isTodayRestDay) {
                    setStartNotice("오늘은 쉬는 날로 설정되어 있습니다.");
                  } else if (todayRoutines.length) {
                    const started = startNativeWorkout(todayExerciseIds);
                    if (!started) navigate("/workout/run");
                  } else {
                    setStartNotice(
                      "루틴이 설정되지 않았습니다."
                    );
                  }
                }}
              >
                {isTodayRestDay ? (
                  <BedDouble size={20} aria-hidden="true" />
                ) : (
                  <Zap size={20} aria-hidden="true" />
                )}
                {isTodayRestDay ? "쉬는 날" : "운동 시작"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="mt-2 gap-2 py-4 text-base"
                onClick={completeTodayWorkout}
                disabled={
                  savingWorkout ||
                  workoutSavedToday
                }
              >
                <CheckCircle size={18} aria-hidden="true" />
                {workoutSavedToday
                  ? "저장됨"
                  : savingWorkout
                    ? "기록 저장 중"
                    : isTodayRestDay
                      ? "쉬는 날"
                      : !todayRoutines.length
                        ? "루틴 없음"
                        : "운동 완료"}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mt-1 text-lg font-extrabold text-[color:var(--c-text)]">
                지금 운동존 상태
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[color:var(--c-muted-2)]">
                {congestion.error ??
                  (congestion.status === "no-signal"
                    ? "혼잡도 신호 없음"
                    : null) ??
                  (formatCongestionUpdatedAt(congestion.updatedAt)
                    ? `${formatCongestionUpdatedAt(congestion.updatedAt)} 업데이트`
                    : "최근 출석 기준")}
              </p>
            </div>
            <div className="text-right">
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => syncCongestion()}
                  disabled={congestion.loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-3 text-xs font-extrabold text-[color:var(--c-text)] shadow-sm transition duration-200 hover:bg-[color:var(--c-surface-2)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="비콘 위치정보 갱신"
                >
                  <RefreshCw
                    size={15}
                    className={congestion.loading ? "animate-spin" : ""}
                    aria-hidden="true"
                  />
                  갱신
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {congestion.beacons.map((beacon) => (
              <CongestionPill
                key={beacon.id}
                title={beacon.title}
                level={beacon.level}
                current={beacon.current}
                rate={beacon.rate}
                loading={congestion.loading}
                status={beacon.status}
              />
            ))}
          </div>
        </Card>
      </section>

      {startNotice ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] px-4">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 py-3 text-center text-sm font-extrabold text-[color:var(--c-text)] shadow-lg">
            {startNotice}
          </div>
        </div>
      ) : null}

      {showRoutineOptions ? (
        <div className="fixed -top-24 bottom-[calc(72px+env(safe-area-inset-bottom))] inset-x-0 z-[70] flex items-center justify-center bg-black/40 px-4 pt-24">
          <button
            type="button"
            aria-label="루틴 추가 선택 닫기"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setShowRoutineOptions(false)}
          />
          <div className="relative mx-auto flex w-full max-w-md items-center">
            <Card className="w-full space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--c-muted)]">
                    루틴 추가
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-[color:var(--c-text)]">
                    추가 방식을 선택해 주세요
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="닫기"
                  onClick={() => setShowRoutineOptions(false)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-muted)] transition hover:bg-[color:var(--c-surface-2)] hover:text-[color:var(--c-text)]"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-2">
                <Button
                  type="button"
                  className="justify-start gap-3 py-4 text-left"
                  onClick={goToWorkoutSelection}
                >
                  <Dumbbell size={20} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    운동 페이지로 이동하기
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="justify-start gap-3 py-4 text-left"
                  onClick={goToManualRoutineAdd}
                >
                  <Pencil size={20} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    수동으로 추가하기
                  </span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
