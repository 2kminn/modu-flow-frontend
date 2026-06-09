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

export function setNativeAuthToken(token) {
  const bridge = getBridgeObject();
  if (!bridge || typeof bridge.setAuthToken !== "function") return false;

  try {
    bridge.setAuthToken(String(token ?? ""));
    return true;
  } catch {
    // ignore
  }
  return false;
}

export function setNativeUserId(userId) {
  const bridge = getBridgeObject();
  if (!bridge || typeof bridge.setUserId !== "function") return false;

  try {
    bridge.setUserId(String(userId ?? ""));
    return true;
  } catch {
    // ignore
  }
  return false;
}

export function clearNativeSession() {
  const bridge = getBridgeObject();
  if (!bridge) return false;

  if (typeof bridge.clearSession === "function") {
    try {
      bridge.clearSession();
      return true;
    } catch {
      // Fall back to clearing individual values.
    }
  }

  const tokenCleared = setNativeAuthToken("");
  const userIdCleared = setNativeUserId("");
  return tokenCleared || userIdCleared;
}

export function getNativeDeviceId() {
  if (typeof window === "undefined") return "";

  const globalValue = String(
    window.__MODUFLOW_DEVICE_ID__ ??
    window.__MODUFLOW_CONFIG__?.deviceId ??
    ""
  ).trim();
  if (globalValue) return globalValue;

  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of ["deviceId", "androidId", "userId"]) {
      const value = String(params.get(key) ?? "").trim();
      if (value) return value;
    }
  } catch {
    // ignore
  }

  const bridge = getBridgeObject();
  if (!bridge) return "";

  for (const methodName of ["getDeviceId", "getAndroidId", "getAndroidID", "getUserId"]) {
    if (typeof bridge[methodName] !== "function") continue;
    try {
      const value = String(bridge[methodName]() ?? "").trim();
      if (value) return value;
    } catch {
      // try the next compatible method
    }
  }

  for (const propertyName of ["deviceId", "androidId", "userId"]) {
    const value = String(bridge[propertyName] ?? "").trim();
    if (value) return value;
  }
  return "";
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
