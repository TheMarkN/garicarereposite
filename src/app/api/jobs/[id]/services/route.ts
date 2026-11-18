import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { need, fail, body, audit, HttpError } from "@/lib/api";

const EDITABLE = ["AWAITING_APPROVAL", "APPROVED", "IN_PROGRESS", "AWAITING_INSPECTION", "REWORK_REQUIRED"];

/** Adds a service to an existing job. Any change resets the job to AWAITING_APPROVAL (new customer approval required). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await need("job:create"); if (g.err) return g.err;
  try {
    const b = await body(req);
    const qty = Math.max(1, Math.floor(Number(b.quantity) || 1));
    await prisma.$transaction(async tx => {
      const j = await tx.job.findUnique({ where: { id: params.id }, include: { approvals: true } });
      if (!j) throw new HttpError(404, "Job not found");
      if (!EDITABLE.includes(j.status)) throw new HttpError(409, "Services can no longer be added to this job");
      const s = await tx.service.findFirst({ where: { id: String(b.serviceId), active: true } });
      if (!s) throw new HttpError(422, "Service not available");
      await tx.jobService.create({ data: { jobId: j.id, serviceId: s.id, unitPrice: s.price, quantity: qty, isExtra: j.approvals.length > 0 } });
      if (j.status !== "AWAITING_APPROVAL") await tx.job.update({ where: { id: j.id }, data: { status: "AWAITING_APPROVAL" } });
      await tx.statusHistory.create({ data: { jobId: j.id, status: "AWAITING_APPROVAL", userId: g.s.uid, reason: `Extra work added: ${s.name}. New approval required` } });
      await audit(tx, g.s.uid, "JOB_SERVICE_ADDED", j.number, s.name);
    });
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
