import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { need, num } from "@/lib/api";
import { OPEN } from "@/lib/jobs";

export async function GET() {
  const g = await need(); if (g.err) return g.err;
  const n = new Date(Date.now() + 3 * 3600e3); n.setUTCHours(0, 0, 0, 0);   // start of today, Nairobi (UTC+3)
  const since = new Date(n.getTime() - 3 * 3600e3);
  const [byStatus, today, pays, ready] = await Promise.all([
    prisma.job.groupBy({ by: ["status"], where: { status: { in: OPEN } }, _count: true }),
    prisma.job.count({ where: { createdAt: { gte: since } } }),
    prisma.payment.groupBy({ by: ["method"], where: { status: "SUCCESSFUL", createdAt: { gte: since } }, _sum: { amount: true } }),
    prisma.job.findMany({ where: { status: "READY_FOR_PAYMENT" }, include: { services: true } }),
  ]);
  const isOwnerView = g.s.role === "ADMIN" || g.s.role === "CASHIER";
  return NextResponse.json({
    jobsToday: today,
    openByStatus: Object.fromEntries(byStatus.map(r => [r.status, r._count])),
    ...(isOwnerView ? {
      collectedToday: Object.fromEntries(pays.map(p => [p.method, num(p._sum.amount ?? 0)])),
      awaitingPayment: ready.reduce((a, j) => a + j.services.reduce((x, s) => x + num(s.unitPrice) * s.quantity, 0), 0),
    } : {}),
  });
}
