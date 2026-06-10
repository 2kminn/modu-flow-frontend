const ROLE_FIELDS = [
  "roles",
  "role",
  "auth",
  "authorities",
  "authority",
  "permissions"
];

function addRoleValues(target, value) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((item) => addRoleValues(target, item));
    return;
  }
  if (typeof value === "object") {
    addRoleValues(
      target,
      value.role ?? value.name ?? value.authority ?? value.value
    );
    return;
  }

  String(value)
    .split(/[,\s]+/)
    .map((role) => role.trim())
    .filter(Boolean)
    .forEach((role) => target.push(role));
}

export function normalizeRoles(...sources) {
  const roles = [];
  sources.forEach((source) => addRoleValues(roles, source));
  return [...new Set(roles)];
}

export function collectAuthRoles(...sources) {
  const roles = [];
  const visited = new Set();

  function visit(source) {
    if (!source || typeof source !== "object" || visited.has(source)) return;
    visited.add(source);

    ROLE_FIELDS.forEach((field) => addRoleValues(roles, source[field]));
    visit(source.user);
    visit(source.account);
    visit(source.member);
    visit(source.data);
  }

  sources.forEach(visit);
  return [...new Set(roles)];
}

export function hasAdminRole(roles) {
  return normalizeRoles(roles).some((role) => {
    const normalized = String(role).trim().toUpperCase();
    return normalized === "ADMIN" || normalized === "ROLE_ADMIN";
  });
}
