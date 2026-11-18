import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

/** Public: the website reads the live service list and prices from here. No login. */
export async function GET() {
  const list = await prisma.service.findMany({
    where: { active: true }, orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, description: true, price: true },
  });
  return NextResponse.json(list);
}
