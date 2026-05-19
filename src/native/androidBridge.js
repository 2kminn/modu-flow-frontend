export const NATIVE_EVENT_NAME = "moduflow:native-event";

function getBridgeObject() {
  if (typeof window === "undefined") return null;
  // Recommended name for Android WebView JS interface.
  if (window.ModuFlowAndroid) return window.ModuFlowAndroid;
  // Common alternatives (in case the host app uses another name).
  if (window.AndroidBridge) return window.AndroidBridge;
  if (window.Android) return window.Android;
  return null;
}

export function isAndroidWebViewBridgeAvailable() {
  const bridge = getBridgeObject();
  if (!bridge) return false;
  return (
    typeof bridge.startWorkout === "function" ||
    typeof bridge.openCamera === "function" ||
    typeof bridge.closeCamera === "function" ||
    typeof bridge.postMessage === "function"
  );
}

export function startNativeWorkout(exercises) {
  const bridge = getBridgeObject();
  if (!bridge || typeof bridge.startWorkout !== "function") return false;

  const exerciseCsv = Array.isArray(exercises)
    ? exercises
        .map((exercise) => String(exercise ?? "").trim())
        .filter(Boolean)
        .join(",")
    : String(exercises ?? "").trim();

  if (!exerciseCsv) return false;

  try {
    bridge.startWorkout(exerciseCsv);
    return true;
  } catch {
    // ignore
  }
  return false;
}

export function openNativeCamera(payload = {}) {
  const bridge = getBridgeObject();
  if (!bridge) return false;

  const message = typeof payload === "string" ? payload : JSON.stringify(payload);

  try {
    if (typeof bridge.openCamera === "function") {
      bridge.openCamera(message);
      return true;
    }
    if (typeof bridge.postMessage === "function") {
      bridge.postMessage(message);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function closeNativeCamera(payload = {}) {
  const bridge = getBridgeObject();
  if (!bridge) return false;

  const message = typeof payload === "string" ? payload : JSON.stringify(payload);

  try {
    if (typeof bridge.closeCamera === "function") {
      bridge.closeCamera(message);
      return true;
    }
    if (typeof bridge.postMessage === "function") {
      bridge.postMessage(
        JSON.stringify({ type: "camera:close", ...payload })
      );
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function onNativeEvent(handler) {
  if (typeof window === "undefined") return () => {};
  const wrapped = (evt) => handler?.(evt?.detail);
  window.addEventListener(NATIVE_EVENT_NAME, wrapped);
  return () => window.removeEventListener(NATIVE_EVENT_NAME, wrapped);
}
