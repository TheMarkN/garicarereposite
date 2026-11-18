import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, can } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const links: [string, string, boolean][] = [
    ["/dashboard", "Dashboard", true], ["/checkin", "Check-in", can(s.role, "job:create")], ["/jobs", "Jobs", true],
    ["/bookings", "Bookings", can(s.role, "booking:view")], ["/services", "Services", can(s.role, "service:manage")],
  ];
  return (
    <>
      <header><h1><Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>Gari Care</Link></h1>
        <nav>{links.filter(l => l[2]).map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</nav>
        <span className="who">{s.name} · {s.role}</span><LogoutButton />
      </header>
      <main>{children}</main>
    </>
  );
}
