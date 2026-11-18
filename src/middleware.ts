import { NextRequest, NextResponse } from "next/server";
import { COOKIE, readToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/" || pathname === "/site.html" || pathname === "/login" || pathname === "/api/auth/login" || pathname.startsWith("/api/public/")) return NextResponse.next();
  const session = await readToken(req.cookies.get(COOKIE)?.value);
  if (session) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  return NextResponse.redirect(new URL("/login", req.url));
}
export const config = { matcher: ["/((?!_next/|favicon.ico).*)"] };
