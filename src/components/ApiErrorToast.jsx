import { API_ERROR_EVENT } from "@/api/client";
import { useEffect, useState } from "react";

export default function ApiErrorToast() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    function onApiError(event) {
      const nextMessage = String(event?.detail?.message || "").trim();
      if (nextMessage) setMessage(nextMessage);
    }
    window.addEventListener(API_ERROR_EVENT, onApiError);
    return () => window.removeEventListener(API_ERROR_EVENT, onApiError);
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-[100] mx-auto max-w-md rounded-2xl border border-red-500/25 bg-[color:var(--c-surface)] px-4 py-3 text-sm font-semibold text-red-600 shadow-lg dark:text-red-300">
      {message}
    </div>
  );
}
