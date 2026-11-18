import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession, can, Session } from "./auth";

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) { super(message); }
}
export type Tx = Prisma.TransactionClient;
type G = { s: Session; err?: undefined } | { s?: undefined; err: NextResponse };

/** Require a signed-in user, optionally with a permission. Usage: const g = await need("job:create"); if (g.err) return g.err; */
export async function need(action?: string): Promise<G> {
  const s = await getSession();
  if (!s) return { err: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  if (action && !can(s.role, action)) return { err: NextResponse.json({ error: "You do not have permission to do this" }, { status: 403 }) };
  return { s };
}
export const fail = (e: unknown) => {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message, ...e.extra }, { status: e.status });
  console.error(e);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function body(req: Request): Promise<Record<string, any>> {
  try { return await req.json(); } catch { throw new HttpError(400, "Invalid request body"); }
}
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const pad = (n: number, w: number) => String(n).padStart(w, "0");
export const num = (d: unknown) => Number(String(d));
/** Atomic sequence counter (job numbers, receipt numbers, temp plate IDs). */
export async function seq(tx: Tx, key: string) {
  const c = await tx.counter.upsert({ where: { key }, update: { value: { increment: 1 } }, create: { key, value: 1 } });
  return c.value;
}
export const audit = (db: Pick<Tx, "auditLog">, userId: string | null, action: string, record?: string, reason?: string) =>
  db.auditLog.create({ data: { userId, action, record, reason } });
export const normPlate = (p: string) => p.toUpperCase().replace(/\s+/g, " ").trim();
export const last9 = (p: string) => p.replace(/\D/g, "").slice(-9);
