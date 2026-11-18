import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fail, body, seq, pad, normPlate, HttpError } from "@/lib/api";
import { limited } from "@/lib/rate";

/** Public: the website posts bookings here. No login. Validated and rate limited. */
export async function POST(req: Request) {
  try {
    if (limited(req, 10)) throw new HttpError(429, "Too many requests, please try again shortly");
    const b = await body(req);
    const name = String(b.name || "").trim().slice(0, 80), phone = String(b.phone || "").trim().slice(0, 20);
    const noPlate = !!b.noPlate, plate = normPlate(String(b.plate || ""));
    const ids: string[] = Array.isArray(b.serviceIds) ? [...new Set<string>(b.serviceIds.map(String))].slice(0, 12) : [];
    if (!name || phone.replace(/\D/g, "").length < 9) throw new HttpError(422, "Name and a valid phone number are required");
    if (!noPlate && !/^[A-Z0-9 ]{3,10}$/.test(plate)) throw new HttpError(422, "Enter a valid plate, or tick that you have none");
    if (!ids.length) throw new HttpError(422, "Select at least one service");
    const found = await prisma.service.count({ where: { id: { in: ids }, active: true } });
    if (found !== ids.length) throw new HttpError(422, "One or more services are unavailable");
    const slot = b.slot ? new Date(String(b.slot)) : null;
    if (slot && (isNaN(slot.getTime()) || slot.getTime() < Date.now() - 3600e3)) throw new HttpError(422, "Choose a future date and time");
    const bk = await prisma.$transaction(async tx =>
      tx.booking.create({ data: { ref: "BK-" + pad(await seq(tx, "booking"), 4), name, phone, plate: noPlate ? null : plate, noPlate, serviceIds: ids, slot } }));
    return NextResponse.json({ ref: bk.ref }, { status: 201 });
  } catch (e) { return fail(e); }
}
