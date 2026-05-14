import { proxyToBackend } from "../../../../../_proxy.js";

export default async function handler(req, res) {
  const itemId = req.query?.itemId;
  const id = Array.isArray(itemId) ? itemId[0] : itemId;
  return proxyToBackend(req, res, `api/v1/routines/items/${id}/count`);
}

