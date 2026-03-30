const TOKEN_KEY = "auth_token";

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
}

export function clearAuthToken() {
  safeRemove(sessionStorage);
  safeRemove(localStorage);
}
