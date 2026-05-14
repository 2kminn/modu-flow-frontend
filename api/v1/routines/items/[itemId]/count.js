import { proxyToBackend } from "../../../../_proxy.js";

export default async function handler(req, res) {
  const id = encodeURIComponent(String(req.query?.itemId || ""));
  return proxyToBackend(req, res, `api/v1/routines/items/${id}/count`);
}
