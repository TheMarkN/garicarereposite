import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { need, fail, body, audit, seq, pad, round2, HttpError } from "@/lib/api";
import { jobTotal, paidSoFar, taxOf } from "@/lib/jobs";

/** Phase 1: full cash payment only. M-Pesa, card and partial payments arrive in Phase 2. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await need("payment:cash"); if (g.err) return g.err;
  try {
    const b = await body(req), t = Number(b.tendered);
    if (!Number.isFinite(t) || t <= 0) throw new HttpError(422, "Enter the cash received");
    const out = await prisma.$transaction(async tx => {
      // Claim the job first so a double-click or two cashiers cannot pay it twice.
      const claimed = await tx.job.updateMany({ where: { id: params.id, status: "READY_FOR_PAYMENT" }, data: { status: "PAID" } });
      if (claimed.count !== 1) throw new HttpError(409, "This job is not ready for payment, or was already paid");
      const job = await tx.job.findUniqueOrThrow({ where: { id: params.id }, include: { services: { include: { service: true } }, payments: true } });
      const total = jobTotal(job), due = round2(total - paidSoFar(job));
      if (t < due) throw new HttpError(422, `Cash received is less than the KES ${due} due. Partial payments arrive in Phase 2`);
      const payment = await tx.payment.create({ data: { jobId: job.id, amount: due, method: "CASH", status: "SUCCESSFUL", cashierId: g.s.uid, tendered: t, change: round2(t - due) } });
      const receipt = await tx.receipt.create({ data: { number: "RCT-" + pad(await seq(tx, "receipt"), 4), jobId: job.id, total, taxAmount: taxOf(job) } });
      await tx.statusHistory.create({ data: { jobId: job.id, status: "PAID", userId: g.s.uid, reason: `Cash payment, ${receipt.number}` } });
      await audit(tx, g.s.uid, "PAYMENT_CASH", job.number, `KES ${due}, ${receipt.number}`);
      return { payment, receipt };
    });
    return NextResponse.json(out, { status: 201 });
  } catch (e) { return fail(e); }
}
