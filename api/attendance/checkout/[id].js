import { proxyToBackend } from "../../_proxy.js";

export default async function handler(req, res) {
  const idValue = req.query?.id;
  const id = Array.isArray(idValue) ? idValue[0] : idValue;
  return proxyToBackend(req, res, `attendance/checkout/${encodeURIComponent(String(id || ""))}`);
}
