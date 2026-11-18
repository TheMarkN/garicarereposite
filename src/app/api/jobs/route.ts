import { NextResponse } from "next/server";
import { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { need, fail, body, audit, seq, pad, normPlate, HttpError } from "@/lib/api";
import { OPEN, JOB_INCLUDE, jobTotal } from "@/lib/jobs";

export async function GET(req: Request) {
  const g = await need(); if (g.err) return g.err;
  const st = new URL(req.url).searchParams.get("status");
  const where = st === "open" ? { status: { in: OPEN } } : st ? { status: st as JobStatus } : {};
  const jobs = await prisma.job.findMany({ where, include: JOB_INCLUDE, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(jobs.map(j => ({ ...j, total: jobTotal(j) })));
}

/** Check-in: creates vehicle (or temp ID), customer, and a job awaiting customer approval. */
export async function POST(req: Request) {
  const g = await need("job:create"); if (g.err) return g.err;
  try {
    const b = await body(req);
    const ids: string[] = Array.isArray(b.serviceIds) ? [...new Set<string>(b.serviceIds.map(String))] : [];
    if (!ids.length) throw new HttpError(422, "Select at least one service");
    const noPlate = !!b.noPlate;
    const plateIn = normPlate(String(b.plate || ""));
    if (!noPlate && !/^[A-Z0-9 ]{3,10}$/.test(plateIn)) throw new HttpError(422, "Enter a valid plate, or check in without a plate");
    const phone = b.phone ? String(b.phone).trim() : "";
    if (phone && phone.replace(/\D/g, "").length < 9) throw new HttpError(422, "Phone number looks too short");

    const services = await prisma.service.findMany({ where: { id: { in: ids }, active: true } });
    if (services.length !== ids.length) throw new HttpError(422, "One or more services are unavailable");

    const job = await prisma.$transaction(async tx => {
      let plate = plateIn;
      if (noPlate) {
        const year = new Date().getFullYear();
        plate = `TMP-${year}-${pad(await seq(tx, `temp-${year}`), 5)}`;
      } else if (!b.force) {
        const open = await tx.job.findFirst({ where: { vehicle: { plate }, status: { in: OPEN } }, select: { number: true } });
        if (open) throw new HttpError(409, "This plate already has an open job", { code: "DUPLICATE_PLATE", jobNumber: open.number });
      }
      let customerId: string | null = null;
      if (phone || b.customerName) {
        const existing = phone ? await tx.customer.findFirst({ where: { phone } }) : null;
        const c = existing ?? await tx.customer.create({ data: { name: String(b.customerName || "Walk-in").trim(), phone: phone || null, consent: !!b.consent } });
        customerId = c.id;
      }
      const vehicle = await tx.vehicle.upsert({
        where: { plate },
        update: { make: b.make || undefined, model: b.model || undefined, colour: b.colour || undefined, ...(customerId ? { customerId } : {}) },
        create: { plate, isTemp: noPlate, make: b.make || null, model: b.model || null, colour: b.colour || null, customerId },
      });
      const number = "JC-" + pad(await seq(tx, "job"), 4);
      const j = await tx.job.create({
        data: {
          number, vehicleId: vehicle.id, customerId, notes: b.notes || null, status: "AWAITING_APPROVAL",
          services: { create: services.map(s => ({ serviceId: s.id, unitPrice: s.price })) },
          history: { create: [{ status: "CHECKED_IN", userId: g.s.uid }, { status: "AWAITING_APPROVAL", userId: g.s.uid, reason: "Quote presented to customer" }] },
        },
        include: JOB_INCLUDE,
      });
      await audit(tx, g.s.uid, "JOB_CREATE", j.number);
      if (b.bookingId) await tx.booking.updateMany({ where: { id: String(b.bookingId), status: "BOOKED" }, data: { status: "CHECKED_IN", jobNumber: j.number } });
      return j;
    });
    return NextResponse.json({ ...job, total: jobTotal(job) }, { status: 201 });
  } catch (e) { return fail(e); }
}
