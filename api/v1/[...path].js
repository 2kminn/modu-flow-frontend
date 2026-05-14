import { proxyToBackend } from "../_proxy.js";

export default async function handler(req, res) {
  const path = Array.isArray(req.query?.path) ? req.query.path : [];
  return proxyToBackend(req, res, `api/v1/${path.join("/")}`);
}
