import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { registerServiceWorker } from "@/pwa";
import { applyTheme, getStoredTheme } from "@/theme/theme";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { setApiBaseUrl } from "@/api/client";
import "@/index.css";

registerServiceWorker();
applyTheme(getStoredTheme() ?? "light");

// Optional runtime override:
//   https://your-frontend/login?apiBaseUrl=http://3.39.194.42:8080
// This helps local/mobile testing override the build-time VITE_API_BASE_URL.
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
  // ignore
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
