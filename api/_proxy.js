// Default is only meant for local/dev. In production, always set BACKEND_ORIGIN.
const DEFAULT_BACKEND_ORIGIN = "http://3.39.194.42:8080";

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function joinUrl(origin, path) {
  const o = normalizeOrigin(origin);
  const p = String(path || "").replace(/^\/+/, "");
  return `${o}/${p}`;
}

function resolveBackendOrigin() {
  const fromEnv = normalizeOrigin(process.env.BACKEND_ORIGIN);
  if (fromEnv) return fromEnv;

  // Vercel sets VERCEL_ENV to "production" | "preview" | "development".
  // If we're deployed and missing BACKEND_ORIGIN, fail closed instead of proxying to an
  // accidental hardcoded origin.
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
        message: "Proxy misconfigured: BACKEND_ORIGIN is required in this environment."
      })
    );
    return;
  }
  const targetUrl = joinUrl(origin, backendPath);

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];
  delete headers.origin;
  delete headers.referer;

  const method = (req.method || "GET").toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await readRawBody(req) : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body
    });

    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "content-encoding") return;
      res.setHeader(key, value);
    });

    const arrayBuf = await upstream.arrayBuffer();
    res.end(Buffer.from(arrayBuf));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        message: "Upstream request failed",
        error: String(e?.message || e)
      })
    );
  }
}
