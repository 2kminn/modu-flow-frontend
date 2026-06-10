import test from "node:test";
import assert from "node:assert/strict";
import { replaceAuthorizationHeader } from "../src/auth/authHeaders.js";
import {
  collectAuthRoles,
  hasAdminRole,
  normalizeRoles
} from "../src/auth/roles.js";
import {
  clearUserStorage,
  getUserStorageKey
} from "../src/auth/userStorage.js";
import { shouldForwardUpstreamHeader } from "../api/_proxy.js";

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

test("replaces a previous account bearer token on every request", () => {
  const headers = {
    Authorization: "Bearer testcd-token",
    authorization: "Bearer stale-token"
  };

  replaceAuthorizationHeader(headers, "test-token");

  assert.deepEqual(headers, { Authorization: "Bearer test-token" });
});

test("removes authorization from unauthenticated requests", () => {
  const headers = { Authorization: "Bearer testcd-token" };

  replaceAuthorizationHeader(headers, "test-token", true);

  assert.deepEqual(headers, {});
});

test("builds different local cache keys for different users", () => {
  const prefix = "moduflow:workout-history:v1:user:";

  assert.notEqual(
    getUserStorageKey(prefix, "22", "testcd@codex.com"),
    getUserStorageKey(prefix, "29", "test@test.com")
  );
});

test("logout clears only the current user's scoped cache and legacy cache", () => {
  const storage = new MemoryStorage({
    "moduflow:routines-by-day:v1:user:22": "{\"mon\":[1]}",
    "moduflow:routines-by-day:v1:user:29": "{\"mon\":[]}",
    "moduflow:workout-history:v1:user:22": "{\"2026-06-10\":[1]}",
    "moduflow:workout-history:v1:user:29": "{}",
    "moduflow:beacon-attendance:v1:testcd%40codex.com:ModuFlow": "2026-06-10",
    "moduflow:auto-attendance-enabled:v1:22": "false",
    "moduflow:profile-name:v1:testcd%40codex.com": "testcd",
    "moduflow:workout-history:v1": "{\"legacy\":true}"
  });

  clearUserStorage(storage, {
    userId: "22",
    accountIdentity: "testcd@codex.com"
  });

  assert.equal(storage.getItem("moduflow:routines-by-day:v1:user:22"), null);
  assert.equal(storage.getItem("moduflow:workout-history:v1:user:22"), null);
  assert.equal(
    storage.getItem("moduflow:beacon-attendance:v1:testcd%40codex.com:ModuFlow"),
    null
  );
  assert.equal(storage.getItem("moduflow:auto-attendance-enabled:v1:22"), null);
  assert.equal(storage.getItem("moduflow:profile-name:v1:testcd%40codex.com"), null);
  assert.equal(storage.getItem("moduflow:workout-history:v1"), null);
  assert.equal(storage.getItem("moduflow:routines-by-day:v1:user:29"), "{\"mon\":[]}");
  assert.equal(storage.getItem("moduflow:workout-history:v1:user:29"), "{}");
});

test("account switch leaves the second account with empty user data", () => {
  const storage = new MemoryStorage({
    "moduflow:routines-by-day:v1:user:22": "{\"mon\":[{\"name\":\"squat\"}]}",
    "moduflow:workout-history:v1:user:22": "{\"2026-06-10\":[{\"name\":\"squat\"}]}",
    "moduflow:beacon-attendance:v1:testcd%40codex.com:ModuFlow": "2026-06-10"
  });

  clearUserStorage(storage, {
    userId: "22",
    accountIdentity: "testcd@codex.com"
  });

  assert.equal(storage.getItem("moduflow:routines-by-day:v1:user:29"), null);
  assert.equal(storage.getItem("moduflow:workout-history:v1:user:29"), null);
  assert.equal(
    storage.getItem("moduflow:beacon-attendance:v1:test%40test.com:ModuFlow"),
    null
  );
});

test("preserves ADMIN from top-level and nested login response roles", () => {
  assert.deepEqual(
    collectAuthRoles({
      role: "ADMIN",
      data: {
        accessToken: "admin-token",
        user: { role: "ROLE_ADMIN" }
      }
    }),
    ["ADMIN", "ROLE_ADMIN"]
  );
});

test("restores persisted ADMIN role after refresh", () => {
  const storedRoles = JSON.parse(JSON.stringify(["ADMIN"]));

  assert.deepEqual(normalizeRoles(storedRoles), ["ADMIN"]);
  assert.equal(hasAdminRole(storedRoles), true);
});

test("recognizes an ADMIN role learned from a successful admin API check", () => {
  const loginRoles = [];
  const rolesAfterAdminCheck = normalizeRoles(loginRoles, "ADMIN");

  assert.deepEqual(rolesAfterAdminCheck, ["ADMIN"]);
  assert.equal(hasAdminRole(rolesAfterAdminCheck), true);
});

test("deployment proxy recalculates transformed response length", () => {
  assert.equal(shouldForwardUpstreamHeader("content-type"), true);
  assert.equal(shouldForwardUpstreamHeader("content-encoding"), false);
  assert.equal(shouldForwardUpstreamHeader("content-length"), false);
  assert.equal(shouldForwardUpstreamHeader("transfer-encoding"), false);
});
