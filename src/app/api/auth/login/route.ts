import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { COOKIE, signSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  const user = email ? await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } }) : null;
  const ok = user && user.active && (await bcrypt.compare(String(password || ""), user.passwordHash));
  if (!user || !ok) return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
  const token = await signSession({ uid: user.id, name: user.name, role: user.role });
  await prisma.auditLog.create({ data: { userId: user.id, action: "LOGIN" } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
  return res;
}
