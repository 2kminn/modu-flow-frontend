import { proxyToBackend } from "../../../../_proxy.js";

export default async function handler(req, res) {
  const date = encodeURIComponent(String(req.query?.date || ""));
  const itemId = encodeURIComponent(String(req.query?.itemId || ""));
  return proxyToBackend(req, res, `api/v1/workouts/${date}/items/${itemId}`);
}
