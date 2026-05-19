import { proxyToBackend } from "../../../../_proxy.js";

export default async function handler(req, res) {
  const dateValue = req.query?.date;
  const date = Array.isArray(dateValue) ? dateValue[0] : dateValue;
  return proxyToBackend(
    req,
    res,
    `api/v1/workouts/${encodeURIComponent(String(date || ""))}/count`
  );
}
