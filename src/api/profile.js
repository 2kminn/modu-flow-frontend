import { apiClient } from "@/api/client";
import {
  getAuthDisplayIdentity,
  getAuthProfileName,
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
  const email = profile.email ?? profile.userEmail;
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

export async function fetchMyProfile() {
  if (isDevTestAuthToken()) {
    return {
      id: "dev-user",
      email: getAuthDisplayIdentity(),
      name: getAuthProfileName()
    };
  }

  const res = await apiClient.get("/api/v1/me", {
    skipAuthRedirect: true
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
