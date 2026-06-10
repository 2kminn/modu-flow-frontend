import { apiClient } from "@/api/client";
import {
  getAuthDisplayIdentity,
  getAuthProfileName,
  getStoredAuthIdentity,
  isDevTestAuthToken
} from "@/auth/auth";

function unwrapProfile(value) {
  const root = value?.data && typeof value.data === "object" ? value.data : value;
  return root?.user && typeof root.user === "object" ? root.user : root;
}

export function normalizeProfile(value) {
  const profile = unwrapProfile(value);
  if (!profile || typeof profile !== "object") return null;

  const id = profile.id ?? profile.userId ?? profile.memberId;
  const email = profile.email ?? profile.userEmail ?? profile.username;
  const name =
    profile.name ??
    profile.nickname ??
    profile.userName ??
    profile.displayName;

  return {
    id: id == null ? "" : String(id),
    email: email == null ? "" : String(email),
    name: name == null ? "" : String(name).trim()
  };
}

export function isCurrentAccountProfile(profile) {
  const currentIdentity = String(getStoredAuthIdentity() || "").trim().toLowerCase();
  const profileEmail = String(profile?.email || "").trim().toLowerCase();
  return !currentIdentity || !profileEmail || currentIdentity === profileEmail;
}

export async function fetchMyProfile() {
  if (isDevTestAuthToken()) {
    return {
      id: "dev-user",
      email: getAuthDisplayIdentity(),
      name: getAuthProfileName()
    };
  }

  const res = await apiClient.get("/api/v1/me", {
    skipAuthRedirect: true,
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache"
    }
  });
  return normalizeProfile(res?.data);
}

export async function updateMyProfileName(name) {
  const normalizedName = String(name || "").trim();
  if (isDevTestAuthToken()) {
    return {
      id: "dev-user",
      email: getAuthDisplayIdentity(),
      name: normalizedName
    };
  }

  const res = await apiClient.patch(
    "/api/v1/me",
    { name: normalizedName },
    { skipAuthRedirect: true }
  );
  const profile = normalizeProfile(res?.data);
  return {
    id: profile?.id ?? "",
    email: profile?.email ?? "",
    name: normalizedName
  };
}

export async function registerMyDevice(androidId, config) {
  const normalizedAndroidId = String(androidId || "").trim();
  if (!normalizedAndroidId || isDevTestAuthToken()) return null;

  const res = await apiClient.post(
    "/api/v1/me/device",
    { androidId: normalizedAndroidId },
    config
  );
  return res?.data;
}
