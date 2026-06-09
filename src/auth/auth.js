import { setNativeAuthToken } from "@/native/androidBridge";

const TOKEN_KEY = "auth_token";
const ACCOUNT_KEY = "auth_account";
const EXPIRES_AT_KEY = "auth_expires_at";
const AUTH_PROVIDER_KEY = "auth_provider";
const AUTH_ROLES_KEY = "auth_roles";
const AUTH_SESSION_SECONDS = 60 * 60;
const PROFILE_NAME_KEY_PREFIX = "moduflow:profile-name:v1:";
const CURRENT_PROFILE_NAME_KEY = "moduflow:profile-name:current:v1";
export const PROFILE_NAME_CHANGED_EVENT = "moduflow:profile-name-changed";
export const DEV_TEST_AUTH_TOKEN = "dev-test-token";

function safeGet(storage, key = TOKEN_KEY) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(storage, key = TOKEN_KEY) {
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

function getAuthExpiresAt() {
  const raw = safeGet(localStorage, EXPIRES_AT_KEY);
  const expiresAt = Number(raw);
  return Number.isFinite(expiresAt) ? expiresAt : 0;
}

function getNextAuthExpiresAt() {
  return Date.now() + AUTH_SESSION_SECONDS * 1000;
}

function clearStoredAuth() {
  safeRemove(sessionStorage);
  safeRemove(sessionStorage, ACCOUNT_KEY);
  safeRemove(sessionStorage, EXPIRES_AT_KEY);
  safeRemove(sessionStorage, AUTH_PROVIDER_KEY);
  safeRemove(sessionStorage, AUTH_ROLES_KEY);
  safeRemove(localStorage);
  safeRemove(localStorage, ACCOUNT_KEY);
  safeRemove(localStorage, EXPIRES_AT_KEY);
  safeRemove(localStorage, AUTH_PROVIDER_KEY);
  safeRemove(localStorage, AUTH_ROLES_KEY);
  safeRemove(localStorage, CURRENT_PROFILE_NAME_KEY);
}

function isLocalAuthExpired() {
  const token = safeGet(localStorage);
  if (!token) return false;
  const expiresAt = getAuthExpiresAt();
  return !expiresAt || Date.now() >= expiresAt;
}

function normalizeAuthProvider(provider) {
  const value = String(provider || "").trim().toLowerCase();
  return value || "email";
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function normalizeRoles(...sources) {
  const roles = [];

  function add(value) {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(add);
      return;
    }
    if (typeof value === "object") {
      add(value.role ?? value.name ?? value.authority ?? value.value);
      return;
    }
    String(value)
      .split(/[,\s]+/)
      .map((role) => role.trim())
      .filter(Boolean)
      .forEach((role) => roles.push(role));
  }

  sources.forEach(add);
  return [...new Set(roles)];
}

function getJwtRoles(token = getAuthToken()) {
  const payload = decodeJwtPayload(token);
  if (!payload) return [];
  return normalizeRoles(
    payload.role,
    payload.roles,
    payload.auth,
    payload.authority,
    payload.authorities,
    payload.permissions,
    payload.scope,
    payload.scopes
  );
}

function persistLocalAuth(token, accountHint, authProvider = "email", roles = []) {
  safeSet(localStorage, TOKEN_KEY, token);
  safeSet(localStorage, EXPIRES_AT_KEY, String(getNextAuthExpiresAt()));
  safeSet(localStorage, AUTH_PROVIDER_KEY, normalizeAuthProvider(authProvider));

  const identity = String(accountHint || "").trim().toLowerCase();
  if (identity) safeSet(localStorage, ACCOUNT_KEY, identity);
  else safeRemove(localStorage, ACCOUNT_KEY);

  const normalizedRoles = normalizeRoles(roles, getJwtRoles(token));
  if (normalizedRoles.length) safeSet(localStorage, AUTH_ROLES_KEY, JSON.stringify(normalizedRoles));
  else safeRemove(localStorage, AUTH_ROLES_KEY);
}

export function getAuthToken() {
  if (isLocalAuthExpired()) {
    clearStoredAuth();
    setNativeAuthToken("");
    return null;
  }

  const localToken = safeGet(localStorage);
  if (localToken) return localToken;

  const legacySessionToken = safeGet(sessionStorage);
  if (!legacySessionToken) return null;

  persistLocalAuth(
    legacySessionToken,
    safeGet(sessionStorage, ACCOUNT_KEY),
    safeGet(sessionStorage, AUTH_PROVIDER_KEY),
    safeGet(sessionStorage, AUTH_ROLES_KEY)
  );
  safeRemove(sessionStorage);
  safeRemove(sessionStorage, ACCOUNT_KEY);
  safeRemove(sessionStorage, EXPIRES_AT_KEY);
  safeRemove(sessionStorage, AUTH_PROVIDER_KEY);
  safeRemove(sessionStorage, AUTH_ROLES_KEY);
  return legacySessionToken;
}

export function isDevTestAuthToken(token = getAuthToken()) {
  return Boolean(import.meta.env.DEV && token === DEV_TEST_AUTH_TOKEN);
}

export function getStoredAuthIdentity() {
  if (isLocalAuthExpired()) {
    clearStoredAuth();
    setNativeAuthToken("");
    return null;
  }
  return safeGet(localStorage, ACCOUNT_KEY) || safeGet(sessionStorage, ACCOUNT_KEY) || null;
}

export function getStoredAuthProvider() {
  if (isLocalAuthExpired()) {
    clearStoredAuth();
    setNativeAuthToken("");
    return "email";
  }
  return normalizeAuthProvider(
    safeGet(localStorage, AUTH_PROVIDER_KEY) || safeGet(sessionStorage, AUTH_PROVIDER_KEY)
  );
}

export function isSocialAuthSession() {
  return getStoredAuthProvider() !== "email";
}

export function getStoredAuthRoles() {
  if (isLocalAuthExpired()) {
    clearStoredAuth();
    setNativeAuthToken("");
    return [];
  }

  let storedRoles = [];
  const raw = safeGet(localStorage, AUTH_ROLES_KEY) || safeGet(sessionStorage, AUTH_ROLES_KEY);
  if (raw) {
    try {
      storedRoles = JSON.parse(raw);
    } catch {
      storedRoles = raw;
    }
  }

  return normalizeRoles(storedRoles, getJwtRoles());
}

export function isAdminSession() {
  return getStoredAuthRoles().some((role) => {
    const normalized = String(role || "").trim().toUpperCase();
    return normalized === "ADMIN" || normalized === "ROLE_ADMIN";
  });
}

function normalizeAccount(accountHint = getStoredAuthIdentity()) {
  return String(accountHint || "").trim().toLowerCase();
}

function getProfileNameKey(accountHint) {
  const account = normalizeAccount(accountHint);
  if (!account) return null;
  return `${PROFILE_NAME_KEY_PREFIX}${encodeURIComponent(account)}`;
}

export function getStoredProfileName(accountHint) {
  const account = normalizeAccount(accountHint);
  const key = getProfileNameKey(account);
  const accountName = key ? safeGet(localStorage, key) : "";
  const fallbackName = account ? "" : safeGet(localStorage, CURRENT_PROFILE_NAME_KEY);
  return String(accountName || fallbackName || "").trim();
}

export function setStoredProfileName(name, accountHint) {
  const key = getProfileNameKey(accountHint);
  const normalizedName = String(name || "").trim();
  if (normalizedName) {
    safeSet(localStorage, CURRENT_PROFILE_NAME_KEY, normalizedName);
    if (key) safeSet(localStorage, key, normalizedName);
  } else {
    safeRemove(localStorage, CURRENT_PROFILE_NAME_KEY);
    if (key) safeRemove(localStorage, key);
  }
  try {
    window.dispatchEvent(
      new CustomEvent(PROFILE_NAME_CHANGED_EVENT, {
        detail: { account: normalizeAccount(accountHint), name: normalizedName }
      })
    );
  } catch {
    // ignore
  }
  return normalizedName;
}

export function getAuthDisplayIdentity() {
  return getStoredAuthIdentity() || "사용자";
}

export function getAuthProfileName() {
  return getStoredProfileName() || getAuthDisplayIdentity();
}

export function setAuthToken(token, accountHint, profileName, authProvider = "email", roles = []) {
  persistLocalAuth(token, accountHint, authProvider, roles);
  setNativeAuthToken(token);
  const identity = String(accountHint || "").trim().toLowerCase();
  if (String(profileName || "").trim()) {
    setStoredProfileName(profileName, identity);
  } else {
    safeRemove(localStorage, CURRENT_PROFILE_NAME_KEY);
  }
  safeRemove(sessionStorage);
  safeRemove(sessionStorage, ACCOUNT_KEY);
  safeRemove(sessionStorage, EXPIRES_AT_KEY);
  safeRemove(sessionStorage, AUTH_PROVIDER_KEY);
  safeRemove(sessionStorage, AUTH_ROLES_KEY);
}

export function syncStoredAuthTokenToNative() {
  const token = getAuthToken();
  if (token) setNativeAuthToken(token);
}

export function clearAuthToken() {
  clearStoredAuth();
  setNativeAuthToken("");
}
