import { proxyToBackend } from "../../../../../_proxy.js";

export default async function handler(req, res) {
  const dateValue = req.query?.date;
  const itemIdValue = req.query?.itemId;
  const date = Array.isArray(dateValue) ? dateValue[0] : dateValue;
  const itemId = Array.isArray(itemIdValue) ? itemIdValue[0] : itemIdValue;
  return proxyToBackend(
    req,
    res,
    `api/v1/workouts/${encodeURIComponent(String(date || ""))}/items/${encodeURIComponent(String(itemId || ""))}`
  );
}
