const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN || "http://3.39.194.42:8080";

function joinUrl(origin, path) {
  const o = String(origin || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${o}/${p}`;
}

export default async function handler(req, res) {
  const pathParts = req.query?.path;
  const path = Array.isArray(pathParts) ? pathParts.join("/") : String(pathParts || "");
  const targetUrl = joinUrl(BACKEND_ORIGIN, path);

  // Clone headers but remove hop-by-hop + CORS-sensitive headers.
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers["content-length"];
  delete headers.origin;
  delete headers.referer;

  const method = req.method || "GET";
  const hasBody = !["GET", "HEAD"].includes(method.toUpperCase());

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? (typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {})) : undefined
    });

    res.status(upstream.status);

    upstream.headers.forEach((value, key) => {
      // Avoid setting forbidden headers; let Vercel handle encoding.
      if (key.toLowerCase() === "content-encoding") return;
      res.setHeader(key, value);
    });

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (e) {
    res.status(502).json({ message: "Upstream request failed", error: String(e?.message || e) });
  }
}

