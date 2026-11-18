// Best-effort limiter for public endpoints (per server instance). Use a shared store (e.g. Upstash) before heavy traffic.
const hits = new Map<string, { n: number; t: number }>();
export function limited(req: Request, max = 20, windowMs = 60_000) {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const now = Date.now(), h = hits.get(ip);
  if (!h || now - h.t > windowMs) { hits.set(ip, { n: 1, t: now }); return false; }
  h.n++; return h.n > max;
}
