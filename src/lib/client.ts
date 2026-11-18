/* eslint-disable @typescript-eslint/no-explicit-any */
export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401) { window.location.href = "/login"; }
    const e: any = new Error(d.error || "Request failed"); e.data = d; e.status = r.status; throw e;
  }
  return d as T;
}
