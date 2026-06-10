export const USER_STORAGE_PREFIXES = [
  "moduflow:routines-by-day:v1:",
  "moduflow:routine-rest-days:v1:",
  "moduflow:workout-history:v1:",
  "moduflow:beacon-attendance:v1:",
  "moduflow:auto-attendance-enabled:v1:",
  "moduflow:profile-name:v1:",
  "moduflow:profile-name-edited:v1:"
];

export const LEGACY_USER_STORAGE_KEYS = [
  "moduflow:routines-by-day:v1",
  "moduflow:workout-history:v1",
  "moduflow:auto-attendance-enabled:v1",
  "moduflow:profile-name:current:v1"
];

export function normalizeStorageIdentity(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function getScopedStorageIdentity(userId, accountIdentity) {
  return normalizeStorageIdentity(userId) || normalizeStorageIdentity(accountIdentity);
}

export function getUserStorageKey(prefix, userId, accountIdentity) {
  const identity = getScopedStorageIdentity(userId, accountIdentity);
  return `${prefix}${encodeURIComponent(identity || "anonymous")}`;
}

export function clearUserStorage(storage, { userId, accountIdentity } = {}) {
  if (!storage) return;

  const identities = new Set(
    [userId, accountIdentity]
      .map(normalizeStorageIdentity)
      .filter(Boolean)
      .map(encodeURIComponent)
  );
  const keysToRemove = new Set(LEGACY_USER_STORAGE_KEYS);

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;

    for (const prefix of USER_STORAGE_PREFIXES) {
      if (!key.startsWith(prefix)) continue;
      const suffix = key.slice(prefix.length);
      if (
        suffix === "guest" ||
        suffix.startsWith("token:") ||
        [...identities].some(
          (identity) =>
            suffix === identity ||
            suffix.startsWith(`${identity}:`) ||
            suffix === `user:${identity}` ||
            suffix.startsWith(`user:${identity}:`)
        )
      ) {
        keysToRemove.add(key);
      }
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}
