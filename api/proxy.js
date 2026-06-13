// Vercel의 /api/v1/* 요청을 공통 proxyToBackend 함수에 전달하는 서버리스 진입점이다.
import { proxyToBackend } from "./_proxy.js";

export default async function handler(req, res) {
  const pathValue = req.query?.path;
  const path = Array.isArray(pathValue) ? pathValue.join("/") : String(pathValue || "");
  return proxyToBackend(req, res, `api/v1/${path.replace(/^\/+/, "")}`);
}
