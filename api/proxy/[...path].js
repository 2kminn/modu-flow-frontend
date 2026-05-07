export const config = {
  runtime: "edge"
};

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

function withCors(res) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  return new Response(res.body, { status: res.status, headers });
}

export default async function handler(request, context) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type"
      }
    });
  }

  const backendOrigin = normalizeOrigin(process.env.BACKEND_ORIGIN);
  const path = Array.isArray(context?.params?.path)
    ? context.params.path.join("/")
    : String(context?.params?.path || "");
  const targetUrl = joinUrl(backendOrigin, path);

  // Forward request but strip CORS-sensitive headers.
  const headers = new Headers(request.headers);
  headers.delete("origin");
  headers.delete("referer");
  headers.set("host", new URL(targetUrl).host);

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body
  });

  return withCors(upstream);
}

