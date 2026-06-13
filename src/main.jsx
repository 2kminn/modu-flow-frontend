// 애플리케이션 진입점이다. PWA, 테마, 인증 토큰, API 주소를 초기화한 뒤 App을 브라우저에 렌더링한다.
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { registerServiceWorker } from "@/pwa";
import { applyTheme, getStoredTheme } from "@/theme/theme";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { setApiBaseUrl } from "@/api/client";
import { syncStoredAuthTokenToNative } from "@/auth/auth";
import "@/index.css";

registerServiceWorker();
applyTheme(getStoredTheme() ?? "light");
syncStoredAuthTokenToNative();

// 로컬·모바일 테스트에서는 URL의 apiBaseUrl 값으로 빌드 시 API 주소를 임시 재정의할 수 있다.
try {
  const params = new URLSearchParams(window.location.search);
  const apiBaseUrl = params.get("apiBaseUrl");
  if (apiBaseUrl) {
    setApiBaseUrl(apiBaseUrl);
    params.delete("apiBaseUrl");
    const qs = params.toString();
    const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }
} catch {
  // 잘못된 URL 값이 들어와도 기본 API 설정으로 계속 실행한다.
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
