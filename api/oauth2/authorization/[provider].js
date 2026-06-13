// 프론트의 소셜 로그인 요청을 허용된 제공자인지 검사한 뒤 백엔드 OAuth 시작 주소로 이동시킨다.
const DEFAULT_BACKEND_ORIGIN = "https://3-39-194-42.sslip.io";

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export default async function handler(req, res) {
  const providerValue = req.query?.provider;
  const provider = Array.isArray(providerValue) ? providerValue[0] : providerValue;
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  const allowed = new Set(["google", "kakao"]);

  if (!allowed.has(normalizedProvider)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        code: "VALIDATION_ERROR",
        message: "Unsupported OAuth provider."
      })
    );
    return;
  }

  const origin = normalizeOrigin(process.env.BACKEND_ORIGIN) || DEFAULT_BACKEND_ORIGIN;
  res.statusCode = 302;
  res.setHeader("Location", `${origin}/oauth2/authorization/${normalizedProvider}`);
  res.end();
}
