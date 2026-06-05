import { setNativeAuthToken } from "@/native/androidBridge";

const TOKEN_KEY = "auth_token";
const ACCOUNT_KEY = "auth_account";
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

export function getAuthToken() {
  const sessionToken = safeGet(sessionStorage);
  if (sessionToken) return sessionToken;

  const legacyLocalToken = safeGet(localStorage);
  if (legacyLocalToken) {
    safeRemove(localStorage);
  }
  return null;
}

export function isDevTestAuthToken(token = getAuthToken()) {
  return Boolean(import.meta.env.DEV && token === DEV_TEST_AUTH_TOKEN);
}

export function getStoredAuthIdentity() {
  return safeGet(sessionStorage, ACCOUNT_KEY) || null;
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
  safeSet(sessionStorage, TOKEN_KEY, token);
  setNativeAuthToken(token);
  const identity = String(accountHint || "").trim().toLowerCase();
  if (identity) safeSet(sessionStorage, ACCOUNT_KEY, identity);
  else safeRemove(sessionStorage, ACCOUNT_KEY);
  if (identity && String(profileName || "").trim()) {
    setStoredProfileName(profileName, identity);
  }
  safeRemove(localStorage);
  safeRemove(localStorage, ACCOUNT_KEY);
}

export function syncStoredAuthTokenToNative() {
  const token = safeGet(sessionStorage);
  if (token) setNativeAuthToken(token);
}

export function clearAuthToken() {
  safeRemove(sessionStorage);
  safeRemove(sessionStorage, ACCOUNT_KEY);
  safeRemove(localStorage);
  safeRemove(localStorage, ACCOUNT_KEY);
  setNativeAuthToken("");
}
