import { setNativeAuthToken } from "@/native/androidBridge";

const TOKEN_KEY = "auth_token";
const ACCOUNT_KEY = "auth_account";
const EXPIRES_AT_KEY = "auth_expires_at";
const AUTH_SESSION_SECONDS = 60 * 60;
const PROFILE_NAME_KEY_PREFIX = "moduflow:profile-name:v1:";
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
  safeRemove(localStorage);
  safeRemove(localStorage, ACCOUNT_KEY);
  safeRemove(localStorage, EXPIRES_AT_KEY);
}

function isLocalAuthExpired() {
  const token = safeGet(localStorage);
  if (!token) return false;
  const expiresAt = getAuthExpiresAt();
  return !expiresAt || Date.now() >= expiresAt;
}

function persistLocalAuth(token, accountHint) {
  safeSet(localStorage, TOKEN_KEY, token);
  safeSet(localStorage, EXPIRES_AT_KEY, String(getNextAuthExpiresAt()));

  const identity = String(accountHint || "").trim().toLowerCase();
  if (identity) safeSet(localStorage, ACCOUNT_KEY, identity);
  else safeRemove(localStorage, ACCOUNT_KEY);
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

  persistLocalAuth(legacySessionToken, safeGet(sessionStorage, ACCOUNT_KEY));
  safeRemove(sessionStorage);
  safeRemove(sessionStorage, ACCOUNT_KEY);
  safeRemove(sessionStorage, EXPIRES_AT_KEY);
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

function normalizeAccount(accountHint = getStoredAuthIdentity()) {
  return String(accountHint || "").trim().toLowerCase();
}

function getProfileNameKey(accountHint) {
  const account = normalizeAccount(accountHint);
  if (!account) return null;
  return `${PROFILE_NAME_KEY_PREFIX}${encodeURIComponent(account)}`;
}

export function getStoredProfileName(accountHint) {
  const key = getProfileNameKey(accountHint);
  if (!key) return "";
  return String(safeGet(localStorage, key) || "").trim();
}

export function setStoredProfileName(name, accountHint) {
  const key = getProfileNameKey(accountHint);
  if (!key) return "";
  const normalizedName = String(name || "").trim();
  if (normalizedName) safeSet(localStorage, key, normalizedName);
  else safeRemove(localStorage, key);
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

export function setAuthToken(token, accountHint, profileName) {
  persistLocalAuth(token, accountHint);
  setNativeAuthToken(token);
  const identity = String(accountHint || "").trim().toLowerCase();
  if (identity && String(profileName || "").trim()) {
    setStoredProfileName(profileName, identity);
  }
  safeRemove(sessionStorage);
  safeRemove(sessionStorage, ACCOUNT_KEY);
  safeRemove(sessionStorage, EXPIRES_AT_KEY);
}

export function syncStoredAuthTokenToNative() {
  const token = getAuthToken();
  if (token) setNativeAuthToken(token);
}

export function clearAuthToken() {
  clearStoredAuth();
  setNativeAuthToken("");
}
