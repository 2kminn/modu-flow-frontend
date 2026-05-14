const DEFAULT_BACKEND_ORIGIN = "http://3.39.194.42:8080";

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export default async function handler(req, res) {
  const providerValue = req.query?.provider;
  const provider = Array.isArray(providerValue) ? providerValue[0] : providerValue;
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  const allowed = new Set(["google", "kakao", "naver"]);

  if (!allowed.has(normalizedProvider)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ message: "Unsupported OAuth provider." }));
    return;
  }

  const origin = normalizeOrigin(process.env.BACKEND_ORIGIN) || DEFAULT_BACKEND_ORIGIN;
  res.statusCode = 302;
  res.setHeader("Location", `${origin}/oauth2/authorization/${normalizedProvider}`);
  res.end();
}
