import { proxyToBackend } from "../../_proxy.js";

export default async function handler(req, res) {
  const date = encodeURIComponent(String(req.query?.date || ""));
  return proxyToBackend(req, res, `api/v1/workouts/${date}`);
}
