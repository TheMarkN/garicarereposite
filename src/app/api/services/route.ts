import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { need, fail, body, audit, HttpError } from "@/lib/api";

export async function GET(req: Request) {
  const g = await need(); if (g.err) return g.err;
  const all = new URL(req.url).searchParams.get("all") === "1" && g.s.role === "ADMIN";
  const services = await prisma.service.findMany({ where: all ? {} : { active: true }, orderBy: [{ category: "asc" }, { name: "asc" }] });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const g = await need("service:manage"); if (g.err) return g.err;
  try {
    const b = await body(req);
    const price = Number(b.price);
    if (!b.name?.trim() || !b.category?.trim() || !(price >= 0)) throw new HttpError(422, "Name, category and a valid price are required");
    const s = await prisma.service.create({ data: { name: String(b.name).trim(), category: String(b.category).trim(), description: b.description || null, price, taxRate: b.taxRate ?? 16, estMinutes: b.estMinutes ? Number(b.estMinutes) : null } });
    await audit(prisma, g.s.uid, "SERVICE_CREATE", s.id);
    return NextResponse.json(s, { status: 201 });
  } catch (e) { return fail(e); }
}
