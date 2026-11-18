"use client";
import { useEffect, useState } from "react";
import { api } from "./client";
import type { Role } from "./perms";
export function useMe() {
  const [me, setMe] = useState<{ uid: string; name: string; role: Role } | null>(null);
  useEffect(() => { api("/api/me").then(setMe).catch(() => {}); }, []);
  return me;
}
