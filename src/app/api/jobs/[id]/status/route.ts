import { NextResponse } from "next/server";
import { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { need, fail, body, audit, HttpError } from "@/lib/api";
import { can } from "@/lib/auth";
import { JOB_INCLUDE, RULES, isApproved } from "@/lib/jobs";

/** Body: { to: "IN_PROGRESS", reason?: "..." }. Only the transitions in RULES are allowed, each with its own permission. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await need(); if (g.err) return g.err;
  try {
    const b = await body(req), to = b.to as JobStatus, reason = b.reason ? String(b.reason).trim() : undefined;
    await prisma.$transaction(async tx => {
      const j = await tx.job.findUnique({ where: { id: params.id }, include: JOB_INCLUDE });
      if (!j) throw new HttpError(404, "Job not found");
      let rule = RULES.find(r => r.from === j.status && r.to === to);
      if (to === "CANCELLED" && !["PAID", "CLOSED", "CANCELLED"].includes(j.status)) rule = { from: j.status, to, perm: "job:cancel", reason: true };
      if (!rule) throw new HttpError(409, `Cannot move a job from ${j.status} to ${to}`);
      if (!can(g.s!.role, rule.perm)) throw new HttpError(403, "You do not have permission to do this");
      if (rule.reason && !reason) throw new HttpError(422, "A reason is required");
      if (j.status === "APPROVED" && to === "IN_PROGRESS" && !isApproved(j)) throw new HttpError(409, "Customer approval is required before work starts");
      const claimed = await tx.job.updateMany({ where: { id: j.id, status: j.status }, data: { status: to, closedAt: to === "CLOSED" || to === "CANCELLED" ? new Date() : undefined } });
      if (claimed.count !== 1) throw new HttpError(409, "Job was just updated, refresh and try again");
      await tx.statusHistory.create({ data: { jobId: j.id, status: to, userId: g.s!.uid, reason } });
      await audit(tx, g.s!.uid, "JOB_STATUS", j.number, `${j.status} -> ${to}${reason ? `: ${reason}` : ""}`);
    });
    return NextResponse.json({ ok: true, status: to });
  } catch (e) { return fail(e); }
}
