import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { need, fail, body, audit, HttpError } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = await need("service:manage"); if (g.err) return g.err;
  try {
    const b = await body(req), data: Record<string, unknown> = {};
    for (const k of ["name", "category", "description"]) if (b[k] !== undefined) data[k] = String(b[k]);
    if (b.price !== undefined) { const p = Number(b.price); if (!(p >= 0)) throw new HttpError(422, "Invalid price"); data.price = p; }
    if (b.taxRate !== undefined) data.taxRate = Number(b.taxRate);
    if (b.estMinutes !== undefined) data.estMinutes = b.estMinutes ? Number(b.estMinutes) : null;
    if (b.active !== undefined) data.active = !!b.active;
    const s = await prisma.service.update({ where: { id: params.id }, data });
    await audit(prisma, g.s.uid, "SERVICE_UPDATE", s.id, b.price !== undefined ? "price/details changed" : undefined);
    return NextResponse.json(s);
  } catch (e) { return fail(e); }
}

// Services are deactivated, never deleted, so old jobs and receipts stay intact.
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const g = await need("service:manage"); if (g.err) return g.err;
  try {
    const s = await prisma.service.update({ where: { id: params.id }, data: { active: false } });
    await audit(prisma, g.s.uid, "SERVICE_DEACTIVATE", s.id);
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
