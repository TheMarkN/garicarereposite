import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { need } from "@/lib/api";
import { JOB_INCLUDE, jobTotal, paidSoFar, isApproved } from "@/lib/jobs";

// :id may be the internal id or the job number (e.g. JC-0001)
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const g = await need(); if (g.err) return g.err;
  const j = await prisma.job.findFirst({ where: { OR: [{ id: params.id }, { number: params.id }] }, include: JOB_INCLUDE });
  if (!j) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  const total = jobTotal(j), paid = paidSoFar(j);
  return NextResponse.json({ ...j, total, paid, due: total - paid, approved: isApproved(j) });
}
