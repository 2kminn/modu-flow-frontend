// 관리자 계정으로 로그인해 JWT 권한과 주요 관리자 API의 상태·CORS 헤더를 점검하는 수동 검증 스크립트다.
const baseUrl = String(
  process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "https://3-39-194-42.sslip.io"
).replace(/\/+$/, "");
const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";
const origin = process.env.CORS_ORIGIN || "http://localhost:5173";

if (!email || !password) {
  console.error(
    "ADMIN_EMAIL and ADMIN_PASSWORD are required.\n" +
      "Example: ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='...' npm run verify:admin-api"
  );
  process.exit(2);
}

function unwrapData(value) {
  return value?.data && typeof value.data === "object" ? value.data : value;
}

function decodeJwtPayload(token) {
  const payload = String(token || "").split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: await readResponse(response)
  };
}

console.log(`API base URL: ${baseUrl}`);

const login = await request("/api/v1/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json", origin },
  body: JSON.stringify({ email, password })
});

console.log(`\nPOST /api/v1/auth/login -> ${login.status}`);
if (login.status < 200 || login.status >= 300) {
  console.log(JSON.stringify(login.body, null, 2));
  process.exit(1);
}

const loginData = unwrapData(login.body) ?? {};
const token = String(loginData.accessToken ?? loginData.token ?? loginData.jwt ?? "").replace(
  /^Bearer\s+/i,
  ""
);
if (!token) {
  console.error("Login succeeded, but the response did not contain an access token.");
  console.log(JSON.stringify(login.body, null, 2));
  process.exit(1);
}

const payload = decodeJwtPayload(token);
console.log(
  "JWT claims:",
  JSON.stringify(
    {
      sub: payload?.sub,
      role: payload?.role,
      roles: payload?.roles,
      auth: payload?.auth,
      authority: payload?.authority,
      authorities: payload?.authorities,
      scope: payload?.scope,
      exp: payload?.exp
    },
    null,
    2
  )
);

const headers = { authorization: `Bearer ${token}`, origin };
const paths = [
  "/api/v1/admin/dashboard/summary",
  "/api/v1/admin/attendances",
  "/api/v1/beacon-zones"
];

let failed = false;
for (const path of paths) {
  const result = await request(path, { headers });
  console.log(`\nGET ${path} -> ${result.status}`);
  console.log(JSON.stringify(result.body, null, 2));
  if (result.status !== 200) failed = true;
}

const unauthenticated = await request("/api/v1/admin/dashboard/summary", {
  headers: { origin }
});
console.log(`\nGET /api/v1/admin/dashboard/summary (no token) -> ${unauthenticated.status}`);
console.log(JSON.stringify(unauthenticated.body, null, 2));
if (unauthenticated.status !== 401) failed = true;

const cors = await request("/api/v1/admin/dashboard/summary", {
  method: "OPTIONS",
  headers: {
    origin,
    "access-control-request-method": "GET",
    "access-control-request-headers": "authorization,content-type"
  }
});
console.log(`\nOPTIONS /api/v1/admin/dashboard/summary -> ${cors.status}`);
console.log(
  JSON.stringify(
    {
      allowOrigin: cors.headers["access-control-allow-origin"],
      allowMethods: cors.headers["access-control-allow-methods"],
      allowHeaders: cors.headers["access-control-allow-headers"],
      allowCredentials: cors.headers["access-control-allow-credentials"]
    },
    null,
    2
  )
);

if (cors.status < 200 || cors.status >= 300) failed = true;
process.exit(failed ? 1 : 0);
