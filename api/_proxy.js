const DEFAULT_BACKEND_ORIGIN = "http://3.39.194.42:8080";

function normalizeOrigin(value) {
  if (!value) return DEFAULT_BACKEND_ORIGIN;
  return String(value).trim().replace(/\/+$/, "");
}

function joinUrl(origin, path) {
  const o = normalizeOrigin(origin);
  const p = String(path || "").replace(/^\/+/, "");
  return `${o}/${p}`;
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

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type"
  );
}

export async function proxyToBackend(req, res, backendPath) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const origin = normalizeOrigin(process.env.BACKEND_ORIGIN);
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

