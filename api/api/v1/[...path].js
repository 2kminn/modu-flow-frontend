import { proxyToBackend } from "../../_proxy.js";

export default async function handler(req, res) {
  const pathValue = req.query?.path;
  const segments = Array.isArray(pathValue) ? pathValue : [pathValue];
  const path = segments
    .filter((segment) => segment != null && segment !== "")
    .map((segment) => encodeURIComponent(String(segment)))
    .join("/");

  return proxyToBackend(req, res, `api/v1/${path}`);
}
