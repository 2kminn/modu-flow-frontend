import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { apiClient } from "@/api";
import { getAuthToken } from "@/auth/auth";

function safeJsonParse(value) {
  if (!value.trim()) return undefined;
  return JSON.parse(value);
}

export default function BackendTest() {
  const baseUrl = useMemo(
    () => String(import.meta.env.VITE_API_BASE_URL || "").trim(),
    []
  );
  const token = useMemo(() => getAuthToken(), []);

  const [path, setPath] = useState("/actuator/health");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function sendRequest(overrides = {}) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const requestPath = (overrides.path ?? path).trim() || "/";
      const requestMethod = (overrides.method ?? method).toUpperCase();
      const requestBodyRaw = overrides.body ?? body;
      const requestBody = ["GET", "HEAD"].includes(requestMethod)
        ? undefined
        : safeJsonParse(requestBodyRaw || "");

      const res = await apiClient.request({
        url: requestPath,
        method: requestMethod,
        data: requestBody,
        validateStatus: () => true
      });

      const next = {
        ok: res.status >= 200 && res.status < 300,
        status: res.status,
        statusText: res.statusText,
        data: res.data
      };
      setResult(next);
      return next;
    } catch (e) {
      setError(
        e?.message ||
          "요청 실패 (CORS/네트워크/주소/백엔드 미실행 여부 확인 필요)"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function quickPing() {
    const candidates = ["/actuator/health", "/health", "/"];
    for (const candidate of candidates) {
      // sequential on purpose: stop early if we get anything meaningful
      const last = await sendRequest({ path: candidate, method: "GET", body: "" });
      if (last?.status && last.status !== 404) return;
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">
          백엔드 연결 테스트
        </p>
        <p className="mt-1 text-lg font-extrabold">Request Sender</p>
      </div>

      <Card>
        <div className="space-y-2 text-sm font-semibold text-[color:var(--c-text)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-extrabold text-[color:var(--c-muted)]">
              Base URL
            </p>
            <p className="break-all text-xs">{baseUrl || "(not set)"}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-extrabold text-[color:var(--c-muted)]">
              Token
            </p>
            <p className="break-all text-xs">{token ? "set" : "empty"}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="flex items-center gap-2">
            <select
              className="h-12 w-28 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-3 text-sm font-extrabold text-[color:var(--c-text)]"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              aria-label="HTTP method"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <div className="flex-1">
              <FloatingLabelInput
                id="backend-test-path"
                label="Path (예: /api/users/login)"
                inputClassName="focus:border-black focus:ring-0"
                value={path}
                onChange={(e) => setPath(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="backend-test-body"
              className="mb-2 block text-xs font-extrabold text-[color:var(--c-muted)]"
            >
              JSON Body (GET/HEAD 제외)
            </label>
            <textarea
              id="backend-test-body"
              className="min-h-28 w-full resize-y rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 py-3 text-sm font-semibold text-[color:var(--c-text)] outline-none"
              placeholder={'예: {"email":"a@a.com","password":"1234"}'}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {error ? (
            <p className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] px-4 py-3 text-sm font-semibold text-[color:var(--c-text)]">
              {error}
            </p>
          ) : null}

          {result ? (
            <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] px-4 py-3">
              <p className="text-sm font-extrabold text-[color:var(--c-text)]">
                {result.ok ? "OK" : "FAIL"} · {result.status}{" "}
                {result.statusText}
              </p>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs font-semibold text-[color:var(--c-text)]">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={() => sendRequest()} disabled={loading}>
              {loading ? "요청 중..." : "요청 보내기"}
            </Button>
            <Button type="button" onClick={quickPing} disabled={loading}>
              Quick Ping
            </Button>
          </div>
        </div>
      </Card>

      <p className="text-xs font-semibold text-[color:var(--c-muted-2)]">
        CORS 에러면 백엔드에서 프론트 오리진(예: http://localhost:5173)을
        허용해줘야 해요.
      </p>
    </section>
  );
}
