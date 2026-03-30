import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "@/App";
import { registerServiceWorker } from "@/pwa";
import { applyTheme, getStoredTheme } from "@/theme/theme";
import { ThemeProvider } from "@/theme/ThemeProvider";
import "@/index.css";

registerServiceWorker();
applyTheme(getStoredTheme() ?? "light");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
