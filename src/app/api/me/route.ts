import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
export async function GET() {
  const s = await getSession();
  return s ? NextResponse.json({ uid: s.uid, name: s.name, role: s.role }) : NextResponse.json({ error: "Unauthorised" }, { status: 401 });
}
