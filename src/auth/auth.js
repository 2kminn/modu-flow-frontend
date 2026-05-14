const TOKEN_KEY = "auth_token";
export const AUTH_CHANGED_EVENT = "moduflow:auth-changed";

function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch {
    // ignore
  }
}

function safeGet(storage) {
  try {
    return storage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function safeSet(storage, token) {
  try {
    storage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

function safeRemove(storage) {
  try {
    storage.removeItem(TOKEN_KEY);
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

export function setAuthToken(token) {
  safeSet(sessionStorage, token);
  safeRemove(localStorage);
  notifyAuthChanged();
}

export function clearAuthToken() {
  safeRemove(sessionStorage);
  safeRemove(localStorage);
  notifyAuthChanged();
}
