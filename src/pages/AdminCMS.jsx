import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DEFAULT_BEACON_ZONES,
  createBeaconZone,
  deleteBeaconZoneById,
  fetchBeaconZones,
  loadBeaconZonesFromLocalStorage,
  saveBeaconZonesToLocalStorage,
  updateBeaconZone
} from "@/api/beaconZones";
import {
  fetchAdminAttendances,
  fetchAdminDashboardSummary
} from "@/api/admin";
import { fetchRecentCongestion } from "@/api/attendance";
import { getApiErrorMessage } from "@/api/client";
import { clearAuthToken } from "@/auth/auth";
import ActionDialog from "@/components/ui/ActionDialog";
import Card from "@/components/ui/Card";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  Activity,
  BarChart3,
  Check,
  ChevronRight,
  Dumbbell,
  Edit3,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "대시보드", icon: BarChart3 },
  { id: "attendance", label: "출결 현황", icon: Users }
];

const emptyForm = { id: "", name: "", capacity: "" };
const DEFAULT_GYM_NAME = "ModuFlow";
const GYM_NAME_STORAGE_KEY = "moduflow:gym-name:v1";
const CONGESTION_SIGNAL_STALE_MS = 2 * 60 * 1000;

function readNumber(...values) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const number = Number(String(value).trim().replace(/%$/, ""));
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function resolveGymName() {
  const globalName =
    typeof window === "undefined"
      ? ""
      : window.__MODUFLOW_GYM_NAME__ ?? window.__MODUFLOW_CONFIG__?.gymName;
  if (globalName) return String(globalName).trim();

  try {
    const storedName = window.localStorage.getItem(GYM_NAME_STORAGE_KEY)?.trim();
    return storedName || import.meta.env.VITE_GYM_NAME || DEFAULT_GYM_NAME;
  } catch {
    return import.meta.env.VITE_GYM_NAME || DEFAULT_GYM_NAME;
  }
}

function getCongestionItems(value) {
  let root = value;
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
  if (!root || typeof root !== "object") return [];

  const source =
    root.beacons ??
    root.beacon_congestion ??
    root.beaconCongestion ??
    root.zones ??
    root.zone_congestion ??
    root.zoneCongestion ??
    root.congestionByZone ??
    root.congestion_by_zone ??
    root.zoneCounts ??
    root.zone_counts ??
    root.congestion ??
    root.items ??
    root.content ??
    (Array.isArray(root) ? root : []);

  if (Array.isArray(source)) return source;
  if (!source || typeof source !== "object") return [];
  return Object.entries(source).map(([name, item]) =>
    item && typeof item === "object" ? { name, ...item } : { name, level: item }
  );
}

function getCongestionItemKeys(item) {
  if (!item || typeof item !== "object") return [];
  return [
    item.beaconId,
    item.beacon_id,
    item.zoneId,
    item.zone_id,
    item.zoneCode,
    item.zone_code,
    item.minor,
    item.id,
    item.uuid,
    item.zoneName,
    item.zone_name,
    item.beaconName,
    item.beacon_name,
    item.name
  ]
    .filter((value) => value != null && value !== "")
    .map(normalizeZoneKey);
}

function normalizeZoneKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function getRateFromLevel(value) {
  const key = String(value ?? "").trim().toLowerCase();
  if (["low", "idle", "free", "easy", "여유", "원활"].includes(key)) return 25;
  if (["mid", "medium", "normal", "moderate", "보통"].includes(key)) return 55;
  if (["high", "busy", "crowded", "congested", "혼잡", "매우혼잡"].includes(key)) {
    return 85;
  }
  return null;
}

function normalizeRate(item, current, capacity) {
  const explicitRate = readNumber(
    item?.percent,
    item?.percentage,
    item?.occupancy,
    item?.congestionRate,
    item?.congestion_rate,
    item?.rate
  );
  if (explicitRate != null) {
    return Math.max(0, Math.min(100, explicitRate <= 1 ? explicitRate * 100 : explicitRate));
  }
  if (current != null && capacity > 0) {
    return Math.max(0, Math.min(100, (current / capacity) * 100));
  }
  return (
    getRateFromLevel(
      item?.congestionStatus ??
      item?.congestion_status ??
      item?.congestionLevel ??
      item?.congestion_level ??
      item?.level ??
      item?.status ??
      item?.congestion
    ) ?? 0
  );
}

function getCongestionStatus(rate, hasSignal) {
  if (!hasSignal) return "신호 없음";
  if (rate > 66) return "혼잡";
  if (rate > 33) return "보통";
  return "여유";
}

function getCongestionUpdatedAt(item, data) {
  const root = data?.data && typeof data.data === "object" ? data.data : data;
  const value =
    item?.lastSeenAt ??
    item?.last_seen_at ??
    item?.lastDetectedAt ??
    item?.last_detected_at ??
    item?.detectedAt ??
    item?.detected_at ??
    item?.recordedAt ??
    item?.recorded_at ??
    item?.updatedAt ??
    item?.updated_at ??
    item?.createdAt ??
    item?.created_at ??
    item?.occurredAt ??
    item?.occurred_at ??
    item?.timestamp ??
    root?.updatedAt ??
    root?.updated_at ??
    root?.createdAt ??
    root?.created_at ??
    root?.occurredAt ??
    root?.occurred_at ??
    root?.timestamp;
  if (!value) return null;

  const numericValue = Number(value);
  const date = new Date(
    Number.isFinite(numericValue)
      ? numericValue < 1_000_000_000_000
        ? numericValue * 1000
        : numericValue
      : value
  );
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function normalizeCongestionZones(data, beaconZones) {
  const items = getCongestionItems(data);
  const usedIndexes = new Set();

  return beaconZones.slice(0, 3).map((zone, zoneIndex) => {
    const zoneKeys = [zone.id, zone.name]
      .filter(Boolean)
      .map(normalizeZoneKey);
    let itemIndex = items.findIndex(
      (item, index) =>
        !usedIndexes.has(index) &&
        getCongestionItemKeys(item).some((key) => zoneKeys.includes(key))
    );
    if (itemIndex < 0 && items[zoneIndex] && !usedIndexes.has(zoneIndex)) {
      itemIndex = zoneIndex;
    }

    const item = itemIndex >= 0 ? items[itemIndex] : null;
    if (itemIndex >= 0) usedIndexes.add(itemIndex);
    const capacity =
      readNumber(
        item?.capacity,
        item?.maxCapacity,
        item?.max_capacity,
        item?.limit,
        item?.acceptableCapacity,
        item?.acceptable_capacity,
        item?.totalCapacity,
        item?.total_capacity
      ) ?? zone.capacity;
    const current = readNumber(
      item?.currentCount,
      item?.current_count,
      item?.peopleCount,
      item?.people_count,
      item?.userCount,
      item?.user_count,
      item?.current,
      item?.count,
      item?.population,
      item?.memberCount,
      item?.member_count
    );
    const updatedAt = getCongestionUpdatedAt(item, data);
    const hasSignal =
      item != null &&
      (updatedAt == null || Date.now() - updatedAt <= CONGESTION_SIGNAL_STALE_MS);
    const rate = hasSignal ? Math.round(normalizeRate(item, current, capacity)) : 0;

    return {
      id: zone.id,
      name: zone.name,
      current: hasSignal ? current : null,
      capacity: Math.max(1, Math.round(capacity)),
      rate,
      status: getCongestionStatus(rate, hasSignal),
      hasSignal,
      updatedAt
    };
  });
}

function displayText(value) {
  return String(value || "").trim() || "-";
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKeyFromRecord(record) {
  return formatDate(record?.checkInAt || record?.createdAt || record?.date);
}

function getRecordStatus(record) {
  const status = String(record?.status || (record?.checkOutAt ? "퇴실" : "출석"))
    .trim()
    .toUpperCase();
  const labels = {
    ABSENT: "미출석",
    PRESENT: "출석",
    CHECKED_IN: "출석",
    CHECKED_OUT: "퇴실"
  };
  return labels[status] ?? status ?? "출석";
}

function getRecordStatusTone(record) {
  const status = getRecordStatus(record);
  if (status === "미출석") {
    return "bg-red-500/10 text-[color:var(--c-danger)]";
  }
  if (status === "퇴실") {
    return "bg-[color:var(--c-surface-2)] text-[color:var(--c-muted)]";
  }
  return "bg-emerald-500/10 text-[color:var(--c-success)]";
}

function isWithinPreset(dateKey, preset) {
  if (!dateKey || preset === "all") return true;

  const today = new Date();
  const target = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(target.getTime())) return false;

  if (preset === "today") return dateKey === formatDate(today);

  if (preset === "week") {
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(today.getDate() - today.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return target >= start && target <= end;
  }

  if (preset === "month") {
    return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
  }

  return true;
}

const attendanceDatePresets = [
  { id: "today", label: "오늘" },
  { id: "week", label: "이번 주" },
  { id: "month", label: "이번 달" }
];

function Sidebar({ open, activeSection, onSelect, onClose }) {
  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        ].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-[280px] border-r border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 py-5 text-[color:var(--c-text)] transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        ].join(" ")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--c-primary),var(--c-purple))] text-white shadow-sm">
              <Dumbbell size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-[color:var(--c-muted-2)]">
                moduflow
              </p>
              <h2 className="text-base font-black">관리자 CMS</h2>
            </div>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-muted)] transition hover:bg-[color:var(--c-surface-2)] lg:hidden"
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="mt-8 space-y-2" aria-label="관리자 메뉴">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeSection;

            return (
              <button
                type="button"
                key={item.label}
                className={[
                  "flex h-12 w-full items-center justify-between rounded-2xl px-4 text-left text-sm font-bold transition",
                  isActive
                    ? "bg-[color:var(--c-primary-soft)] text-[color:var(--c-primary)]"
                    : "text-[color:var(--c-muted)] hover:bg-[color:var(--c-surface-2)] hover:text-[color:var(--c-text)]"
                ].join(" ")}
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} aria-hidden="true" />
                  {item.label}
                </span>
                {isActive ? <ChevronRight size={17} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <Card className="rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[color:var(--c-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
        </div>
        <div className={["grid h-12 w-12 place-items-center rounded-2xl", tone].join(" ")}>
          <Icon size={22} aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}

function AdminCMS() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [beaconZones, setBeaconZones] = useState(() => loadBeaconZonesFromLocalStorage());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceFilters, setAttendanceFilters] = useState({
    query: "",
    datePreset: "today",
    status: "all"
  });
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [dashboardSummary, setDashboardSummary] = useState({
    totalMembers: 0,
    checkedInCount: 0,
    absentCount: 0,
    attendanceRate: 0
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardMessage, setDashboardMessage] = useState("");
  const [congestionData, setCongestionData] = useState(null);
  const [loadingCongestion, setLoadingCongestion] = useState(true);
  const [congestionMessage, setCongestionMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [deleteZoneId, setDeleteZoneId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loadingZones, setLoadingZones] = useState(true);
  const [savingZone, setSavingZone] = useState(false);
  const [zoneMessage, setZoneMessage] = useState("");

  const { totalMembers, checkedInCount, absentCount, attendanceRate } = dashboardSummary;
  const isEditing = editingId != null;
  const congestionZones = useMemo(
    () => normalizeCongestionZones(congestionData, beaconZones),
    [beaconZones, congestionData]
  );
  const filteredAttendanceRecords = useMemo(() => {
    const query = attendanceFilters.query.trim().toLowerCase();
    return attendanceRecords.filter((record) => {
      const dateKey = dateKeyFromRecord(record);
      if (!isWithinPreset(dateKey, attendanceFilters.datePreset)) return false;

      const status = getRecordStatus(record);
      if (attendanceFilters.status !== "all" && status !== attendanceFilters.status) return false;

      if (!query) return true;
      const searchable = [
        record.email,
        record.name,
        record.id,
        status,
        formatDateTime(record.checkInAt)
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return searchable.includes(query);
    });
  }, [attendanceFilters, attendanceRecords]);

  const loadCongestion = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingCongestion(true);
    try {
      const data = await fetchRecentCongestion({ gymName: resolveGymName() });
      setCongestionData(data);
      setCongestionMessage("");
    } catch (err) {
      setCongestionMessage(getApiErrorMessage(err, "공간별 혼잡도를 불러오지 못했어요."));
    } finally {
      setLoadingCongestion(false);
    }
  }, []);

  function confirmLogout() {
    clearAuthToken();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    let active = true;

    async function syncBeaconZones() {
      setLoadingZones(true);
      try {
        const zones = await fetchBeaconZones();
        if (!active) return;
        setBeaconZones(zones.length ? zones : DEFAULT_BEACON_ZONES);
        setZoneMessage("");
      } catch (e) {
        if (!active) return;
        setBeaconZones(loadBeaconZonesFromLocalStorage());
        setZoneMessage("비콘 구역 API를 불러오지 못해 저장된 설정을 표시 중입니다.");
      } finally {
        if (active) setLoadingZones(false);
      }
    }

    syncBeaconZones();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboardSummary() {
      if (activeSection !== "dashboard") return;
      setLoadingDashboard(true);
      try {
        const summary = await fetchAdminDashboardSummary();
        if (!active) return;
        setDashboardSummary(summary);
        setDashboardMessage("");
      } catch (err) {
        if (!active) return;
        setDashboardMessage(getApiErrorMessage(err, "대시보드 요약을 불러오지 못했어요."));
      } finally {
        if (active) setLoadingDashboard(false);
      }
    }

    loadDashboardSummary();
    return () => {
      active = false;
    };
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== "dashboard") return undefined;

    loadCongestion();
    const timer = window.setInterval(() => loadCongestion({ silent: true }), 60_000);
    window.addEventListener("focus", loadCongestion);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", loadCongestion);
    };
  }, [activeSection, loadCongestion]);

  useEffect(() => {
    let active = true;

    async function loadAttendance() {
      if (activeSection !== "attendance") return;
      setLoadingAttendance(true);
      try {
        const records = await fetchAdminAttendances();
        if (!active) return;
        setAttendanceRecords(records);
        setAttendanceMessage("");
      } catch (err) {
        if (!active) return;
        setAttendanceRecords([]);
        setAttendanceMessage(getApiErrorMessage(err, "출결 현황을 불러오지 못했어요."));
      } finally {
        if (active) setLoadingAttendance(false);
      }
    }

    loadAttendance();
    return () => {
      active = false;
    };
  }, [activeSection]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(zone) {
    setEditingId(zone.id);
    setForm({ id: zone.id, name: zone.name, capacity: String(zone.capacity) });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveBeaconZone(e) {
    e.preventDefault();
    if (savingZone) return;
    const id = form.id.trim();
    const name = form.name.trim();
    const capacity = Number(form.capacity);

    if (!id || !name || !Number.isFinite(capacity) || capacity <= 0) return;

    const nextZone = { id, name, capacity: Math.round(capacity) };
    const hasDuplicate = beaconZones.some((zone) => zone.id === id && zone.id !== editingId);
    if (hasDuplicate) {
      setZoneMessage("이미 등록된 비콘 ID입니다.");
      return;
    }

    setSavingZone(true);
    try {
      const saved = isEditing
        ? await updateBeaconZone(editingId, nextZone)
        : await createBeaconZone(nextZone);
      const zoneToStore = { ...(saved ?? {}), ...nextZone };
      setBeaconZones((zones) => {
        const next = isEditing
          ? zones.map((zone) => (zone.id === editingId ? zoneToStore : zone))
          : [...zones, zoneToStore];
        saveBeaconZonesToLocalStorage(next);
        return next;
      });
      setZoneMessage("비콘 구역 설정이 저장되었습니다.");
      closeModal();
    } catch (err) {
      setBeaconZones((zones) => {
        const next = isEditing
          ? zones.map((zone) => (zone.id === editingId ? nextZone : zone))
          : [...zones, nextZone];
        saveBeaconZonesToLocalStorage(next);
        return next;
      });
      setZoneMessage(
        `${getApiErrorMessage(err, "비콘 구역 API 저장에 실패했어요.")} 로컬 설정에는 반영했습니다.`
      );
      closeModal();
    } finally {
      setSavingZone(false);
    }
  }

  async function deleteBeaconZone(zoneId) {
    const next = beaconZones.filter((zone) => zone.id !== zoneId);
    setDeleteZoneId(null);
    setBeaconZones(next);
    saveBeaconZonesToLocalStorage(next);
    try {
      await deleteBeaconZoneById(zoneId);
      setZoneMessage("비콘 구역이 삭제되었습니다.");
    } catch (err) {
      setZoneMessage(
        `${getApiErrorMessage(err, "비콘 구역 API 삭제에 실패했어요.")} 로컬 설정에는 반영했습니다.`
      );
    }
  }

  return (
    <div className="min-h-dvh bg-[color:var(--c-bg)] text-[color:var(--c-text)]">
      <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar
          open={sidebarOpen}
          activeSection={activeSection}
          onSelect={setActiveSection}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-[color:var(--c-border)] bg-[color:var(--c-surface)]/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-primary)] shadow-sm transition hover:bg-[color:var(--c-primary-soft)] lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="메뉴 열기"
                >
                  <Menu size={20} aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">
                    {activeSection === "dashboard" ? "대시보드" : "출결 현황"}
                  </h1>
                  <p className="mt-1 hidden text-sm font-semibold text-[color:var(--c-muted)] sm:block">
                    {activeSection === "dashboard"
                      ? "헬스장 운영 현황을 한눈에 확인하세요."
                      : "회원의 출석 상태와 이용 구역을 확인하세요."}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden rounded-full border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] px-3 py-2 text-xs font-extrabold text-[color:var(--c-primary)] sm:inline-flex">
                  관리자
                </span>
                <ThemeToggle />
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-3 text-xs font-extrabold text-[color:var(--c-muted)] shadow-sm transition hover:bg-[color:var(--c-surface-2)] hover:text-[color:var(--c-text)] active:scale-[0.98]"
                  onClick={() => setLogoutModalOpen(true)}
                  aria-label="관리자 로그아웃"
                >
                  <LogOut size={15} aria-hidden="true" />
                  <span className="hidden sm:inline">로그아웃</span>
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <p className="mb-4 text-sm font-semibold text-[color:var(--c-muted)] sm:hidden">
              {activeSection === "dashboard"
                ? "헬스장 운영 현황을 한눈에 확인하세요."
                : "회원의 출석 상태와 이용 구역을 확인하세요."}
            </p>

            {activeSection === "dashboard" ? (
              <>
                {dashboardMessage ? (
                  <p className="mb-4 text-sm font-extrabold text-[color:var(--c-danger)]">
                    {dashboardMessage}
                  </p>
                ) : null}
                <section className="grid gap-4 md:grid-cols-3">
                  <StatCard
                    icon={Activity}
                    label="현재 출석 인원"
                    value={loadingDashboard ? "..." : `${checkedInCount}명`}
                    tone="bg-[color:var(--c-primary-soft)] text-[color:var(--c-primary)]"
                  />
                  <StatCard
                    icon={Users}
                    label="총 회원 수"
                    value={loadingDashboard ? "..." : `${totalMembers}명`}
                    tone="bg-[color:var(--c-purple-soft)] text-[color:var(--c-purple)]"
                  />
                  <StatCard
                    icon={Check}
                    label="출석률"
                    value={loadingDashboard ? "..." : `${attendanceRate}%`}
                    tone="bg-emerald-500/10 text-[color:var(--c-success)]"
                  />
                </section>

                <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                  <Card className="rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-base font-black">출결 현황</h2>
                        <p className="mt-1 text-sm font-semibold text-[color:var(--c-muted)]">
                          총 회원 수 {totalMembers}명 기준
                        </p>
                      </div>
                      <span className="rounded-full bg-[color:var(--c-primary-soft)] px-3 py-1 text-xs font-extrabold text-[color:var(--c-primary)]">
                        실시간
                      </span>
                    </div>

                    <div className="mt-6 grid items-center gap-6 sm:grid-cols-[180px_1fr]">
                      <div
                        className="mx-auto grid h-44 w-44 place-items-center rounded-full"
                        style={{
                          background: `conic-gradient(var(--c-primary) 0 ${attendanceRate}%, var(--c-surface-2) ${attendanceRate}% 100%)`
                        }}
                        aria-label={`출석률 ${attendanceRate}%`}
                      >
                        <div className="grid h-28 w-28 place-items-center rounded-full border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-center">
                          <div>
                            <p className="text-2xl font-black">{attendanceRate}%</p>
                            <p className="text-xs font-bold text-[color:var(--c-muted)]">출석률</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {[
                          ["총 회원 수", `${totalMembers}명`],
                          ["출석 회원", `${checkedInCount}명`],
                          ["미출석 회원", `${absentCount}명`]
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex items-center justify-between rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] px-4 py-3"
                          >
                            <span className="text-sm font-bold text-[color:var(--c-muted)]">
                              {label}
                            </span>
                            <span className="text-base font-black">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card className="rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-black">구역별 혼잡도 현황</h2>
                        <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted)]">
                          실시간 구역 혼잡도 기준 · 1분마다 갱신
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadCongestion()}
                        disabled={loadingCongestion}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-3 text-xs font-extrabold text-[color:var(--c-text)] shadow-sm transition hover:bg-[color:var(--c-surface-2)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="공간별 혼잡도 갱신"
                      >
                        <RefreshCw
                          size={15}
                          className={loadingCongestion ? "animate-spin" : ""}
                          aria-hidden="true"
                        />
                        {loadingCongestion ? "갱신 중" : "갱신"}
                      </button>
                    </div>
                    {congestionMessage ? (
                      <p className="mt-3 text-xs font-extrabold text-[color:var(--c-danger)]">
                        {congestionMessage}
                      </p>
                    ) : null}
                    <div className="mt-5 space-y-5">
                      {congestionZones.map((zone) => (
                        <div key={zone.id}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-black">{zone.name}</p>
                              <p className="mt-1 text-sm font-semibold text-[color:var(--c-muted)]">
                                {zone.current == null ? "0명" : `${Math.round(zone.current)}명`} /{" "}
                                {zone.capacity}명
                              </p>
                            </div>
                            <span
                              className={[
                                "rounded-full px-3 py-1 text-xs font-extrabold",
                                zone.status === "혼잡"
                                  ? "bg-red-500/10 text-[color:var(--c-danger)]"
                                  : zone.status === "신호 없음"
                                    ? "bg-[color:var(--c-surface-2)] text-[color:var(--c-muted)]"
                                    : "bg-[color:var(--c-primary-soft)] text-[color:var(--c-primary)]"
                              ].join(" ")}
                            >
                              {zone.rate}% · {zone.status}
                            </span>
                          </div>
                          <div className="mt-3 h-3 overflow-hidden rounded-full bg-[color:var(--c-surface-2)]">
                            <div
                              className={[
                                "h-full rounded-full",
                                zone.status === "혼잡"
                                  ? "bg-[color:var(--c-danger)]"
                                  : zone.status === "신호 없음"
                                    ? "bg-[color:var(--c-muted-2)]"
                                    : "bg-[linear-gradient(135deg,var(--c-primary),var(--c-purple))]"
                              ].join(" ")}
                              style={{ width: `${zone.rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>

                <Card className="mt-4 rounded-2xl p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-black">비콘 구역 설정</h2>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--c-muted)]">
                        구역별 비콘 ID, 표시 이름, 수용 인원을 관리합니다.
                      </p>
                      {zoneMessage ? (
                        <p className="mt-2 text-xs font-extrabold text-[color:var(--c-primary)]">
                          {zoneMessage}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--c-primary),var(--c-purple))] px-4 text-sm font-extrabold text-white shadow-sm transition hover:brightness-105 active:scale-[0.98]"
                      onClick={openAddModal}
                    >
                      <Plus size={18} aria-hidden="true" /> 구역 추가
                    </button>
                  </div>

                  <div className="mt-5 overflow-x-auto">
                    <table className="min-w-[640px] w-full border-separate border-spacing-0 text-left">
                      <thead>
                        <tr className="text-xs font-extrabold uppercase tracking-wide text-[color:var(--c-muted-2)]">
                          <th className="border-b border-[color:var(--c-border)] px-3 py-3">
                            비콘 ID
                          </th>
                          <th className="border-b border-[color:var(--c-border)] px-3 py-3">
                            구역명
                          </th>
                          <th className="border-b border-[color:var(--c-border)] px-3 py-3">
                            수용 인원
                          </th>
                          <th className="border-b border-[color:var(--c-border)] px-3 py-3 text-right">
                            관리
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {beaconZones.map((zone) => (
                          <tr key={zone.id} className="text-sm font-bold">
                            <td className="border-b border-[color:var(--c-border)] px-3 py-4 text-[color:var(--c-primary)]">
                              {zone.id}
                            </td>
                            <td className="border-b border-[color:var(--c-border)] px-3 py-4">
                              {zone.name}
                            </td>
                            <td className="border-b border-[color:var(--c-border)] px-3 py-4">
                              {zone.capacity}명
                            </td>
                            <td className="border-b border-[color:var(--c-border)] px-3 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  className="inline-flex h-10 items-center gap-1 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-3 text-xs font-extrabold text-[color:var(--c-primary)] transition hover:bg-[color:var(--c-primary-soft)]"
                                  onClick={() => openEditModal(zone)}
                                >
                                  <Edit3 size={14} aria-hidden="true" /> 수정
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex h-10 items-center gap-1 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-extrabold text-[color:var(--c-danger)] transition hover:bg-red-500/15"
                                  onClick={() => setDeleteZoneId(zone.id)}
                                >
                                  <Trash2 size={14} aria-hidden="true" /> 삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {loadingZones ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="border-b border-[color:var(--c-border)] px-3 py-6 text-center text-sm font-bold text-[color:var(--c-muted)]"
                            >
                              비콘 구역을 불러오는 중입니다.
                            </td>
                          </tr>
                        ) : null}
                        {!loadingZones && beaconZones.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="border-b border-[color:var(--c-border)] px-3 py-6 text-center text-sm font-bold text-[color:var(--c-muted)]"
                            >
                              등록된 비콘 구역이 없습니다.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="rounded-2xl p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-base font-black">회원 출결 목록</h2>
                    <p className="mt-1 text-sm font-semibold text-[color:var(--c-muted)]">
                      개인정보 보호를 위해 아이디와 이름은 일부만 표시됩니다.
                    </p>
                    {attendanceMessage ? (
                      <p className="mt-2 text-xs font-extrabold text-[color:var(--c-danger)]">
                        {attendanceMessage}
                      </p>
                    ) : null}
                  </div>
                  <span className="w-fit rounded-full bg-[color:var(--c-primary-soft)] px-3 py-1 text-xs font-extrabold text-[color:var(--c-primary)]">
                    {filteredAttendanceRecords.length}명
                  </span>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto]">
                  <label className="relative block">
                    <span className="sr-only">출결 검색</span>
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--c-muted-2)]"
                      size={18}
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      className="h-12 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] pl-11 pr-4 text-sm font-bold outline-none transition placeholder:text-[color:var(--c-muted-2)] focus:border-[color:var(--c-primary)] focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
                      value={attendanceFilters.query}
                      onChange={(e) =>
                        setAttendanceFilters((prev) => ({ ...prev, query: e.target.value }))
                      }
                      placeholder="이메일, 이름, 상태 검색"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {attendanceDatePresets.map((preset) => (
                      <button
                        type="button"
                        key={preset.id}
                        className={[
                          "h-12 rounded-2xl border px-4 text-sm font-extrabold transition",
                          attendanceFilters.datePreset === preset.id
                            ? "border-transparent bg-[color:var(--c-primary)] text-white shadow-sm"
                            : "border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-muted)] hover:bg-[color:var(--c-surface-2)] hover:text-[color:var(--c-text)]"
                        ].join(" ")}
                        onClick={() =>
                          setAttendanceFilters((prev) => ({ ...prev, datePreset: preset.id }))
                        }
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">출결 상태 필터</span>
                    <select
                      className="h-12 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-extrabold text-[color:var(--c-text)] outline-none transition focus:border-[color:var(--c-primary)] focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
                      value={attendanceFilters.status}
                      onChange={(e) =>
                        setAttendanceFilters((prev) => ({ ...prev, status: e.target.value }))
                      }
                    >
                      <option value="all">전체</option>
                      <option value="출석">출석</option>
                      <option value="미출석">미출석</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    className="h-12 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-extrabold text-[color:var(--c-muted)] transition hover:bg-[color:var(--c-surface-2)] hover:text-[color:var(--c-text)]"
                    onClick={() =>
                      setAttendanceFilters({
                        query: "",
                        datePreset: "today",
                        status: "all"
                      })
                    }
                  >
                    초기화
                  </button>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
                    <thead>
                      <tr className="text-xs font-extrabold uppercase tracking-wide text-[color:var(--c-muted-2)]">
                        <th className="border-b border-[color:var(--c-border)] px-3 py-3">
                          이메일
                        </th>
                        <th className="border-b border-[color:var(--c-border)] px-3 py-3">
                          이름
                        </th>
                        <th className="border-b border-[color:var(--c-border)] px-3 py-3">
                          출석 시간
                        </th>
                        <th className="border-b border-[color:var(--c-border)] px-3 py-3">
                          상태
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendanceRecords.map((record, index) => (
                        <tr
                          key={`${record.id}-${record.checkInAt || index}`}
                          className="text-sm font-bold"
                        >
                          <td className="border-b border-[color:var(--c-border)] px-3 py-4 text-[color:var(--c-primary)]">
                            {displayText(record.email)}
                          </td>
                          <td className="border-b border-[color:var(--c-border)] px-3 py-4">
                            {displayText(record.name)}
                          </td>
                          <td className="border-b border-[color:var(--c-border)] px-3 py-4 text-[color:var(--c-muted)]">
                            {formatDateTime(record.checkInAt)}
                          </td>
                          <td className="border-b border-[color:var(--c-border)] px-3 py-4">
                            <span
                              className={[
                                "rounded-full px-3 py-1 text-xs font-extrabold",
                                getRecordStatusTone(record)
                              ].join(" ")}
                            >
                              {getRecordStatus(record)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {loadingAttendance ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="border-b border-[color:var(--c-border)] px-3 py-8 text-center text-sm font-bold text-[color:var(--c-muted)]"
                          >
                            출결 현황을 불러오는 중입니다.
                          </td>
                        </tr>
                      ) : null}
                      {!loadingAttendance && filteredAttendanceRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="border-b border-[color:var(--c-border)] px-3 py-8 text-center text-sm font-bold text-[color:var(--c-muted)]"
                          >
                            조건에 맞는 출결 기록이 없습니다.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>

      <ActionDialog
        open={logoutModalOpen}
        tone="logout"
        title="로그아웃하시겠어요?"
        description="관리자 페이지를 종료하고 로그인 화면으로 이동합니다."
        confirmLabel="로그아웃"
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />

      <ActionDialog
        open={Boolean(deleteZoneId)}
        tone="danger"
        title="비콘 구역을 삭제할까요?"
        description="선택한 비콘 구역 설정이 삭제됩니다."
        confirmLabel="삭제"
        onCancel={() => setDeleteZoneId(null)}
        onConfirm={() => deleteBeaconZone(deleteZoneId)}
      />

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-slate-950/40 px-4 py-4 backdrop-blur-sm sm:place-items-center">
          <form
            className="w-full max-w-md rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-5 shadow-2xl"
            onSubmit={saveBeaconZone}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">
                {isEditing ? "비콘 구역 수정" : "비콘 구역 추가"}
              </h2>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--c-border)] text-[color:var(--c-muted)] transition hover:bg-[color:var(--c-surface-2)]"
                onClick={closeModal}
                aria-label="모달 닫기"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="text-sm font-bold text-[color:var(--c-muted)]">비콘 ID</span>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-bold outline-none transition focus:border-[color:var(--c-primary)] focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
                  value={form.id}
                  onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="B005"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-[color:var(--c-muted)]">구역명</span>
                <input
                  className="mt-2 h-12 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-bold outline-none transition focus:border-[color:var(--c-primary)] focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="필라테스 존"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-[color:var(--c-muted)]">수용 인원</span>
                <input
                  type="number"
                  min="1"
                  className="mt-2 h-12 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 text-sm font-bold outline-none transition focus:border-[color:var(--c-primary)] focus:ring-2 focus:ring-[color:var(--c-focus-ring)]"
                  value={form.capacity}
                  onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
                  placeholder="20"
                  required
                />
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="h-12 flex-1 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-sm font-extrabold text-[color:var(--c-text)] transition hover:bg-[color:var(--c-surface-2)]"
                onClick={closeModal}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={savingZone}
                className="h-12 flex-1 rounded-2xl bg-[linear-gradient(135deg,var(--c-primary),var(--c-purple))] text-sm font-extrabold text-white shadow-sm transition hover:brightness-105 active:scale-[0.98]"
              >
                {savingZone ? "저장 중" : "저장"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default AdminCMS;
