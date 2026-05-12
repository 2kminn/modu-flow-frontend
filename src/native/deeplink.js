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
  const qp = buildQuery(params).slice(1); // remove leading '?'
  const qPart = qp ? `?${qp}` : "";
  // intent://<host><path>?<query>#Intent;scheme=<scheme>;package=<pkg>;end
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

  // Fallback: if app isn't installed, keep user on the web.
  // (Custom Tabs will just ignore scheme if no handler)
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

