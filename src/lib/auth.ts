import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./perms";
export type { Role } from "./perms";
export { can } from "./perms";

export type Session = { uid: string; name: string; role: Role };
export const COOKIE = "gc_session";

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "");

export const signSession = (s: Session) =>
  new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("12h").sign(key());

export async function readToken(t?: string): Promise<Session | null> {
  if (!t || !process.env.AUTH_SECRET) return null;
  try { const { payload } = await jwtVerify(t, key()); return payload as unknown as Session; }
  catch { return null; }
}
export const getSession = () => readToken(cookies().get(COOKIE)?.value);
