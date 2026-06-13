// Vercel 서버리스 프록시의 공통 구현이다. 요청 본문·헤더·CORS를 정리해 실제 백엔드로 전달한다.
// 기본 주소는 로컬 개발 전용이며 운영 배포에서는 BACKEND_ORIGIN 환경 변수를 사용한다.
const DEFAULT_BACKEND_ORIGIN = "https://3-39-194-42.sslip.io";

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function joinUrl(origin, path) {
  const o = normalizeOrigin(origin);
  const p = String(path || "").replace(/^\/+/, "");
  return `${o}/${p}`;
}

function appendQueryParams(url, query) {
  if (!query || typeof query !== "object") return url;
  const out = new URL(url);
  for (const [key, value] of Object.entries(query)) {
    if (key === "path") continue;
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((it) => {
        if (it != null) out.searchParams.append(key, String(it));
      });
      continue;
    }
    out.searchParams.append(key, String(value));
  }
  return out.toString();
}

function resolveBackendOrigin() {
  const fromEnv = normalizeOrigin(process.env.BACKEND_ORIGIN);
  if (fromEnv) return fromEnv;

  // 배포 환경에서 BACKEND_ORIGIN이 빠지면 하드코딩 주소로 잘못 전송하지 않고 요청을 거부한다.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development") return "";

  return DEFAULT_BACKEND_ORIGIN;
}

async function readRawBody(req) {
  if (req.body != null) {
    if (typeof req.body === "string") return req.body;
    try {
      return JSON.stringify(req.body);
    } catch {
      return "";
    }
  }

  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export function hasRequestBody(req) {
  const contentLength = Number(req?.headers?.["content-length"]);
  if (Number.isFinite(contentLength) && contentLength > 0) return true;
  if (req?.headers?.["transfer-encoding"]) return true;

  if (typeof req?.body === "string") return req.body.length > 0;
  if (Buffer.isBuffer(req?.body)) return req.body.length > 0;
  return req?.body != null;
}

function parseAllowedOrigins() {
  const raw = String(process.env.CORS_ALLOW_ORIGINS || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function setCors(req, res) {
  const requestOrigin = req?.headers?.origin;
  if (!requestOrigin) return false;

  const allowed = parseAllowedOrigins();
  if (!allowed.length) return false;

  if (allowed.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (allowed.includes(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Vary", "Origin");
  } else {
    return false;
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  return true;
}

export function shouldForwardUpstreamHeader(key) {
  const normalizedKey = String(key || "").toLowerCase();
  return ![
    "content-encoding",
    "content-length",
    "transfer-encoding"
  ].includes(normalizedKey);
}

export async function proxyToBackend(req, res, backendPath) {
  const corsAllowed = setCors(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = corsAllowed ? 204 : 403;
    res.end();
    return;
  }

  const origin = resolveBackendOrigin();
  if (!origin) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        code: "PROXY_CONFIGURATION_ERROR",
        message: "Proxy misconfigured: BACKEND_ORIGIN is required in this environment."
      })
    );
    return;
  }
  const targetUrl = appendQueryParams(joinUrl(origin, backendPath), req.query);

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];
  delete headers.origin;
  delete headers.referer;

  const method = (req.method || "GET").toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method) && hasRequestBody(req);
  const body = hasBody ? await readRawBody(req) : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body
    });

    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      if (!shouldForwardUpstreamHeader(key)) return;
      res.setHeader(key, value);
    });
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Vary", "Authorization");

    const arrayBuf = await upstream.arrayBuffer();
    res.end(Buffer.from(arrayBuf));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        code: "UPSTREAM_REQUEST_FAILED",
        message: String(e?.message || e) || "Upstream request failed"
      })
    );
  }
}
