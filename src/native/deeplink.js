// Android 브라우저에서 ModuFlow 앱 화면을 여는 커스텀 스킴과 intent URL을 생성한다.
function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

function buildQuery(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return;
    usp.set(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

function getScheme() {
  return import.meta.env.VITE_APP_SCHEME || "moduflow";
}

function getAndroidPackage() {
  return import.meta.env.VITE_ANDROID_PACKAGE || "";
}

function buildAndroidIntentUrl({ host, path, params }) {
  const pkg = getAndroidPackage();
  if (!pkg) return null;
  const qp = buildQuery(params).slice(1); // URL 조합을 위해 앞의 물음표를 제거한다.
  const qPart = qp ? `?${qp}` : "";
  // Android가 인식하는 intent URL 규격으로 앱 패키지와 경로를 묶는다.
  return `intent://${host}${path}${qPart}#Intent;scheme=${getScheme()};package=${pkg};end`;
}

export function openNativeScreen({
  host = "app",
  path = "/workout/run",
  params = {},
  fallbackUrl = ""
} = {}) {
  if (typeof window === "undefined") return false;
  if (!isAndroid()) return false;

  const intentUrl = buildAndroidIntentUrl({ host, path, params });
  const schemeUrl = `${getScheme()}://${host}${path}${buildQuery(params)}`;

  // 앱이 설치되지 않은 경우에는 fallbackUrl을 사용해 웹 화면에 남긴다.
  const fallback =
    fallbackUrl || `${window.location.origin}${path}${buildQuery(params)}`;

  let didHide = false;
  const onHide = () => {
    didHide = true;
  };
  document.addEventListener("visibilitychange", onHide, { once: true });

  const t = window.setTimeout(() => {
    if (!didHide) window.location.href = fallback;
  }, 900);

  try {
    window.location.href = intentUrl || schemeUrl;
    return true;
  } finally {
    window.setTimeout(() => window.clearTimeout(t), 1500);
  }
}
