import { registerSW } from "virtual:pwa-register";

export function registerServiceWorker() {
  if (!import.meta.env.PROD) {
    clearDevServiceWorker();
    return;
  }

  let updateSW;
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true);
    }
  });
}

function clearDevServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  async function clear() {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ("caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }

    if (navigator.serviceWorker.controller) {
      const reloadKey = "moduflow:dev-sw-cleared:v1";
      const didReload = window.sessionStorage.getItem(reloadKey);
      if (!didReload) {
        window.sessionStorage.setItem(reloadKey, "true");
        window.location.reload();
      }
    }
  }

  clear().catch((error) => {
    console.warn("[pwa] failed to clear dev service worker:", error);
  });
}
