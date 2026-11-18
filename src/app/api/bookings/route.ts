import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { need } from "@/lib/api";

export async function GET() {
  const g = await need("booking:view"); if (g.err) return g.err;
  return NextResponse.json(await prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 100 }));
}
