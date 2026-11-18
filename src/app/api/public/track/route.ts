import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { last9 } from "@/lib/api";
import { limited } from "@/lib/rate";

const STEP: Record<string, number> = { CHECKED_IN: 0, AWAITING_APPROVAL: 0, APPROVED: 1, IN_PROGRESS: 2, REWORK_REQUIRED: 2, AWAITING_INSPECTION: 3, READY_FOR_PAYMENT: 4, PARTIALLY_PAID: 4, PAID: 5, CLOSED: 5 };
const LABEL = ["Checked in", "Quote approved", "In progress", "Quality check", "Ready for payment", "Paid & closed"];

/**
 * Public. Needs a reference (booking BK-0001 or job JC-0001) AND the phone number given at booking/check-in,
 * so a plate or reference alone cannot be used to look up someone else's car.
 */
export async function GET(req: Request) {
  if (limited(req, 15)) return NextResponse.json({ error: "Too many requests, please try again shortly" }, { status: 429 });
  const sp = new URL(req.url).searchParams, ref = (sp.get("ref") || "").toUpperCase().replace(/\s/g, ""), phone = last9(sp.get("phone") || "");
  const miss = () => NextResponse.json({ error: "No matching booking or job. Check the reference and phone number." }, { status: 404 });
  if (!ref || phone.length < 9) return miss();

  let jobNumber = ref, byBooking = false;
  if (ref.startsWith("BK-")) {
    const b = await prisma.booking.findUnique({ where: { ref } });
    if (!b || last9(b.phone) !== phone) return miss();
    if (!b.jobNumber) return NextResponse.json({ jobNumber: b.ref, plate: b.noPlate ? "No plate" : b.plate ?? "", status: "Booked", step: -1, steps: LABEL, booked: true, slot: b.slot });
    jobNumber = b.jobNumber; byBooking = true;
  }
  const j = await prisma.job.findUnique({ where: { number: jobNumber }, include: { customer: true, vehicle: true } });
  if (!j) return miss();
  if (!byBooking && (!j.customer?.phone || last9(j.customer.phone) !== phone)) return miss();
  const step = STEP[j.status] ?? 0;
  return NextResponse.json({ jobNumber: j.number, plate: j.vehicle.plate, status: LABEL[step], step, steps: LABEL, cancelled: j.status === "CANCELLED" });
}
