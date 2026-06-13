// 웹 화면과 Android WebView의 자바스크립트 인터페이스를 연결해 카메라·운동·세션 기능을 호출한다.
export const NATIVE_EVENT_NAME = "moduflow:native-event";

function getBridgeObject() {
  if (typeof window === "undefined") return null;
  // 앱에서 우선 사용하도록 정한 Android WebView 인터페이스 이름이다.
  if (window.ModuFlowAndroid) return window.ModuFlowAndroid;
  // 호스트 앱의 구현 차이를 고려해 자주 쓰이는 대체 이름도 확인한다.
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
    // 네이티브 메서드 호출 실패 시 웹 기능으로 대체할 수 있도록 false를 반환한다.
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
    // 네이티브 메서드 호출 실패 시 웹 기능으로 대체할 수 있도록 false를 반환한다.
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
    // 네이티브 메서드 호출 실패 시 웹 기능으로 대체할 수 있도록 false를 반환한다.
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
      // 일괄 삭제 메서드가 없으면 토큰과 사용자 ID를 각각 비운다.
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
    // 네이티브 세션 삭제 실패가 웹 로그아웃을 막지 않게 한다.
  }

  const bridge = getBridgeObject();
  if (!bridge) return "";

  for (const methodName of ["getDeviceId", "getAndroidId", "getAndroidID", "getUserId"]) {
    if (typeof bridge[methodName] !== "function") continue;
    try {
      const value = String(bridge[methodName]() ?? "").trim();
      if (value) return value;
    } catch {
      // 현재 메서드가 실패하면 다음 호환 메서드를 시도한다.
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
    // 카메라 실행 실패 시 브라우저 카메라를 사용할 수 있도록 false를 반환한다.
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
    // 카메라 종료 실패가 화면 정리를 막지 않게 한다.
  }
  return false;
}

export function onNativeEvent(handler) {
  if (typeof window === "undefined") return () => {};
  const wrapped = (evt) => handler?.(evt?.detail);
  window.addEventListener(NATIVE_EVENT_NAME, wrapped);
  return () => window.removeEventListener(NATIVE_EVENT_NAME, wrapped);
}
