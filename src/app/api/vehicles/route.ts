import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { need, normPlate } from "@/lib/api";

export async function GET(req: Request) {
  const g = await need(); if (g.err) return g.err;
  const q = normPlate(new URL(req.url).searchParams.get("q") || "");
  if (q.length < 2) return NextResponse.json([]);
  const vehicles = await prisma.vehicle.findMany({
    where: { OR: [{ plate: { contains: q } }, { customer: { phone: { contains: q } } }, { customer: { name: { contains: q, mode: "insensitive" } } }] },
    include: { customer: true, jobs: { orderBy: { createdAt: "desc" }, take: 5, select: { number: true, status: true, createdAt: true } } },
    take: 10,
  });
  return NextResponse.json(vehicles);
}
