import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { need, fail, body, audit, HttpError } from "@/lib/api";
import { JOB_INCLUDE, jobTotal } from "@/lib/jobs";

/** Records the customer's approval of the CURRENT total. Work cannot start without it. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await need("job:approve"); if (g.err) return g.err;
  try {
    const b: Record<string, any> = await body(req).catch(() => ({}));
    const out = await prisma.$transaction(async tx => {
      const j = await tx.job.findUnique({ where: { id: params.id }, include: JOB_INCLUDE });
      if (!j) throw new HttpError(404, "Job not found");
      if (!["CHECKED_IN", "AWAITING_APPROVAL"].includes(j.status)) throw new HttpError(409, "This job is not waiting for approval");
      const claimed = await tx.job.updateMany({ where: { id: j.id, status: j.status }, data: { status: "APPROVED" } });
      if (claimed.count !== 1) throw new HttpError(409, "Job was just updated, refresh and try again");
      const amount = jobTotal(j);
      await tx.approval.create({ data: { jobId: j.id, amount, isExtra: j.approvals.length > 0, method: b.method === "link" ? "link" : "in-person", recordedById: g.s.uid } });
      await tx.statusHistory.create({ data: { jobId: j.id, status: "APPROVED", userId: g.s.uid, reason: `Customer approved KES ${amount}` } });
      await audit(tx, g.s.uid, "JOB_APPROVED", j.number, `KES ${amount}`);
      return { number: j.number, status: "APPROVED", approvedAmount: amount };
    });
    return NextResponse.json(out);
  } catch (e) { return fail(e); }
}
