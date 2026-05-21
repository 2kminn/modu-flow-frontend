const TOKEN_KEY = "auth_token";
const ACCOUNT_KEY = "auth_account";
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

export function setAuthToken(token, accountHint) {
  safeSet(sessionStorage, TOKEN_KEY, token);
  const identity = String(accountHint || "").trim().toLowerCase();
  if (identity) safeSet(sessionStorage, ACCOUNT_KEY, identity);
  else safeRemove(sessionStorage, ACCOUNT_KEY);
  safeRemove(localStorage);
  safeRemove(localStorage, ACCOUNT_KEY);
}

export function clearAuthToken() {
  safeRemove(sessionStorage);
  safeRemove(sessionStorage, ACCOUNT_KEY);
  safeRemove(localStorage);
  safeRemove(localStorage, ACCOUNT_KEY);
}
