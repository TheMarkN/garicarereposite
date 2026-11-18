"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { dt } from "@/lib/labels";

export default function Bookings() {
  const [list, setList] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  useEffect(() => {
    Promise.all([api("/api/bookings"), api("/api/services?all=1").catch(() => api("/api/services"))])
      .then(([b, s]) => { setList(b); setNames(Object.fromEntries(s.map((x: any) => [x.id, x.name]))); })
      .catch(e => setErr(e.message));
  }, []);
  const href = (b: any) => "/checkin?" + new URLSearchParams({ booking: b.id, ref: b.ref, plate: b.plate ?? "", noPlate: b.noPlate ? "1" : "", name: b.name, phone: b.phone, services: b.serviceIds.join(",") }).toString();
  return (
    <>
      <h2>Website bookings</h2>
      <p className="note">Bookings made on the public website appear here. Click Check in when the customer arrives: the details are filled in for you.</p>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="wrap"><table>
        <thead><tr><th>Ref</th><th>Customer</th><th>Phone</th><th>Plate</th><th>Slot</th><th>Services</th><th>Status</th><th></th></tr></thead>
        <tbody>{list.map(b => (
          <tr key={b.id}><td>{b.ref}</td><td>{b.name}</td><td>{b.phone}</td><td>{b.noPlate ? "No plate" : b.plate}</td><td>{b.slot ? dt(b.slot) : "–"}</td>
            <td>{b.serviceIds.map((i: string) => names[i] || "Service").join(", ")}</td>
            <td><span className={`chip ${b.status === "BOOKED" ? "warn" : "ok"}`}>{b.status === "BOOKED" ? "Booked" : "Checked in"}</span></td>
            <td>{b.status === "BOOKED" ? <Link href={href(b)}><button>Check in</button></Link> : b.jobNumber ? <Link href={`/jobs/${b.jobNumber}`}>{b.jobNumber}</Link> : null}</td></tr>
        ))}{!list.length && <tr><td colSpan={8}>No bookings yet.</td></tr>}</tbody>
      </table></div>
    </>
  );
}
