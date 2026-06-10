import {
  clearNativeSession,
  setNativeAuthToken,
  setNativeUserId
} from "@/native/androidBridge";
import { clearUserStorage } from "@/auth/userStorage";
import { hasAdminRole, normalizeRoles } from "@/auth/roles";

const TOKEN_KEY = "auth_token";
const ACCOUNT_KEY = "auth_account";
const USER_ID_KEY = "auth_user_id";
const EXPIRES_AT_KEY = "auth_expires_at";
const AUTH_PROVIDER_KEY = "auth_provider";
const AUTH_ROLES_KEY = "auth_roles";
const AUTH_SESSION_SECONDS = 60 * 60;
const PROFILE_NAME_KEY_PREFIX = "moduflow:profile-name:v1:";
const PROFILE_NAME_EDITED_KEY_PREFIX = "moduflow:profile-name-edited:v1:";
const CURRENT_PROFILE_NAME_KEY = "moduflow:profile-name:current:v1";
export const PROFILE_NAME_CHANGED_EVENT = "moduflow:profile-name-changed";
export const AUTH_SESSION_CHANGED_EVENT = "moduflow:auth-session-changed";
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
  safeRemove(sessionStorage, USER_ID_KEY);
  safeRemove(sessionStorage, EXPIRES_AT_KEY);
  safeRemove(sessionStorage, AUTH_PROVIDER_KEY);
  safeRemove(sessionStorage, AUTH_ROLES_KEY);
  safeRemove(localStorage);
  safeRemove(localStorage, ACCOUNT_KEY);
  safeRemove(localStorage, USER_ID_KEY);
  safeRemove(localStorage, EXPIRES_AT_KEY);
  safeRemove(localStorage, AUTH_PROVIDER_KEY);
  safeRemove(localStorage, AUTH_ROLES_KEY);
  safeRemove(localStorage, CURRENT_PROFILE_NAME_KEY);
}

function emitAuthSessionChanged(type) {
  try {
    window.dispatchEvent(
      new CustomEvent(AUTH_SESSION_CHANGED_EVENT, {
        detail: {
          type,
          identity: getStoredAuthIdentity(),
          userId: getStoredAuthUserId()
        }
      })
    );
  } catch {
    // ignore
  }
}

function clearStoredUserData(userId, accountIdentity) {
  try {
    clearUserStorage(localStorage, { userId, accountIdentity });
  } catch {
    // ignore
  }
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

function normalizeUserId(value) {
  return String(value ?? "").trim();
}

function getJwtUserId(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return "";
  return normalizeUserId(
    payload.userId ??
      payload.user_id ??
      payload.memberId ??
      payload.member_id ??
      payload.id ??
      payload.sub
  );
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

function persistLocalAuth(token, accountHint, authProvider = "email", roles = [], userId) {
  safeSet(localStorage, TOKEN_KEY, token);
  safeSet(localStorage, EXPIRES_AT_KEY, String(getNextAuthExpiresAt()));
  safeSet(localStorage, AUTH_PROVIDER_KEY, normalizeAuthProvider(authProvider));

  const identity = String(accountHint || "").trim().toLowerCase();
  if (identity) safeSet(localStorage, ACCOUNT_KEY, identity);
  else safeRemove(localStorage, ACCOUNT_KEY);

  const normalizedUserId =
    normalizeUserId(userId) || getJwtUserId(token) || normalizeUserId(accountHint);
  if (normalizedUserId) safeSet(localStorage, USER_ID_KEY, normalizedUserId);
  else safeRemove(localStorage, USER_ID_KEY);

  const normalizedRoles = normalizeRoles(roles, getJwtRoles(token));
  if (normalizedRoles.length) safeSet(localStorage, AUTH_ROLES_KEY, JSON.stringify(normalizedRoles));
  else safeRemove(localStorage, AUTH_ROLES_KEY);
}

export function getAuthToken() {
  if (isLocalAuthExpired()) {
    clearStoredAuth();
    clearNativeSession();
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
    safeGet(sessionStorage, AUTH_ROLES_KEY),
    safeGet(sessionStorage, USER_ID_KEY)
  );
  safeRemove(sessionStorage);
  safeRemove(sessionStorage, ACCOUNT_KEY);
  safeRemove(sessionStorage, USER_ID_KEY);
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
    clearNativeSession();
    return null;
  }
  return safeGet(localStorage, ACCOUNT_KEY) || safeGet(sessionStorage, ACCOUNT_KEY) || null;
}

export function getStoredAuthUserId() {
  if (isLocalAuthExpired()) {
    clearStoredAuth();
    clearNativeSession();
    return null;
  }

  const storedUserId =
    safeGet(localStorage, USER_ID_KEY) || safeGet(sessionStorage, USER_ID_KEY);
  if (storedUserId) return storedUserId;

  const token = getAuthToken();
  const derivedUserId = getJwtUserId(token) || normalizeUserId(getStoredAuthIdentity());
  if (derivedUserId) safeSet(localStorage, USER_ID_KEY, derivedUserId);
  return derivedUserId || null;
}

export function getStoredAuthProvider() {
  if (isLocalAuthExpired()) {
    clearStoredAuth();
    clearNativeSession();
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
    clearNativeSession();
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

export function addStoredAuthRoles(...roles) {
  const normalizedRoles = normalizeRoles(getStoredAuthRoles(), ...roles);
  if (normalizedRoles.length) {
    safeSet(localStorage, AUTH_ROLES_KEY, JSON.stringify(normalizedRoles));
  }
  return normalizedRoles;
}

export function getAuthSessionKey() {
  const token = getAuthToken();
  if (!token) return "anonymous";
  return [
    getStoredAuthUserId() || "",
    getStoredAuthIdentity() || "",
    token
  ].join(":");
}

export function isAdminSession() {
  return hasAdminRole(getStoredAuthRoles());
}

function normalizeAccount(accountHint = getStoredAuthIdentity()) {
  return String(accountHint || "").trim().toLowerCase();
}

function getProfileNameKey(accountHint) {
  const account = normalizeAccount(accountHint);
  if (!account) return null;
  return `${PROFILE_NAME_KEY_PREFIX}${encodeURIComponent(account)}`;
}

function getProfileNameEditedKey(accountHint) {
  const account = normalizeAccount(accountHint);
  if (!account) return null;
  return `${PROFILE_NAME_EDITED_KEY_PREFIX}${encodeURIComponent(account)}`;
}

export function hasUserEditedProfileName(accountHint) {
  const key = getProfileNameEditedKey(accountHint);
  return Boolean(key && safeGet(localStorage, key) === "1");
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

export function setUserEditedProfileName(name, accountHint) {
  const normalizedName = setStoredProfileName(name, accountHint);
  const key = getProfileNameEditedKey(accountHint);
  if (key && normalizedName) safeSet(localStorage, key, "1");
  else if (key) safeRemove(localStorage, key);
  return normalizedName;
}

export function getAuthDisplayIdentity() {
  const identity = getStoredAuthIdentity();
  if (!identity) return "사용자";
  if (isSocialAuthSession() && !identity.includes("@")) return "사용자";
  return identity;
}

export function getAuthProfileName() {
  const storedName = getStoredProfileName();
  if (storedName) return storedName;
  return isSocialAuthSession() ? "사용자" : getAuthDisplayIdentity();
}

export function setAuthToken(
  token,
  accountHint,
  profileName,
  authProvider = "email",
  roles = [],
  userId
) {
  const previousIdentity = getStoredAuthIdentity();
  const previousUserId = getStoredAuthUserId();
  const nextIdentity = String(accountHint || "").trim().toLowerCase();
  const nextUserId = normalizeUserId(userId) || getJwtUserId(token) || nextIdentity;

  if (
    previousIdentity &&
    (previousIdentity !== nextIdentity || normalizeUserId(previousUserId) !== nextUserId)
  ) {
    clearStoredUserData(previousUserId, previousIdentity);
  }
  clearStoredUserData(nextUserId, nextIdentity);
  persistLocalAuth(token, accountHint, authProvider, roles, userId);
  setNativeAuthToken(token);
  setNativeUserId(getStoredAuthUserId() || "");
  const identity = String(accountHint || "").trim().toLowerCase();
  if (String(profileName || "").trim()) {
    setStoredProfileName(profileName, identity);
  } else {
    safeRemove(localStorage, CURRENT_PROFILE_NAME_KEY);
    if (normalizeAuthProvider(authProvider) !== "email" && !hasUserEditedProfileName(identity)) {
      const profileKey = getProfileNameKey(identity);
      if (profileKey) safeRemove(localStorage, profileKey);
    }
  }
  safeRemove(sessionStorage);
  safeRemove(sessionStorage, ACCOUNT_KEY);
  safeRemove(sessionStorage, USER_ID_KEY);
  safeRemove(sessionStorage, EXPIRES_AT_KEY);
  safeRemove(sessionStorage, AUTH_PROVIDER_KEY);
  safeRemove(sessionStorage, AUTH_ROLES_KEY);
  emitAuthSessionChanged("login");
}

export function syncStoredAuthTokenToNative() {
  const token = getAuthToken();
  if (token) {
    setNativeAuthToken(token);
    setNativeUserId(getStoredAuthUserId() || "");
  }
}

export function clearAuthToken() {
  const identity = getStoredAuthIdentity();
  const userId = getStoredAuthUserId();
  clearStoredUserData(userId, identity);
  clearStoredAuth();
  clearNativeSession();
  emitAuthSessionChanged("logout");
}
