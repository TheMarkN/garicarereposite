import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { need, audit, num } from "@/lib/api";
import { JOB_INCLUDE } from "@/lib/jobs";

/** Receipt data as JSON (the PDF renderer will consume this in the next step). Each view of a reprint is audited. */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const g = await need(); if (g.err) return g.err;
  const j = await prisma.job.findFirst({ where: { OR: [{ id: params.id }, { number: params.id }] }, include: JOB_INCLUDE });
  const r = j?.receipts[0];
  if (!j || !r) return NextResponse.json({ error: "No receipt for this job yet" }, { status: 404 });
  await audit(prisma, g.s.uid, "RECEIPT_VIEW", r.number);
  const pay = j.payments.find(p => p.status === "SUCCESSFUL");
  return NextResponse.json({
    receiptNumber: r.number, issuedAt: r.issuedAt, jobNumber: j.number, plate: j.vehicle.plate,
    customer: j.customer?.name ?? "Walk-in",
    lines: j.services.map(s => ({ name: s.service.name, quantity: s.quantity, unitPrice: num(s.unitPrice), lineTotal: num(s.unitPrice) * s.quantity })),
    total: num(r.total), vatIncluded: num(r.taxAmount), paymentMethod: pay?.method, tendered: pay ? num(pay.tendered) : null, change: pay ? num(pay.change) : null, status: "Paid",
    note: "App-generated receipt. Not a KRA eTIMS tax invoice.",
  });
}
