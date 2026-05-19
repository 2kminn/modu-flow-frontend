import { proxyToBackend } from "./_proxy.js";

export default async function handler(req, res) {
  const pathValue = req.query?.path;
  const path = Array.isArray(pathValue) ? pathValue.join("/") : String(pathValue || "");
  return proxyToBackend(req, res, `api/v1/${path.replace(/^\/+/, "")}`);
}
