"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { kes } from "@/lib/labels";
import Chip from "@/components/Chip";

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => { Promise.all([api("/api/dashboard"), api("/api/jobs?status=open")]).then(([a, b]) => { setD(a); setJobs(b); }).catch(e => setErr(e.message)); }, []);
  const c = (s: string) => d?.openByStatus?.[s] ?? 0;
  const cash = d?.collectedToday ? (Object.values(d.collectedToday) as number[]).reduce((a, b) => a + b, 0) : null;
  return (
    <>
      <h2>Dashboard</h2>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="stats">
        <div className="stat"><b>{d?.jobsToday ?? "–"}</b><small>Jobs today</small></div>
        <div className="stat"><b>{d ? c("AWAITING_APPROVAL") : "–"}</b><small>Awaiting approval</small></div>
        <div className="stat"><b>{d ? c("APPROVED") + c("IN_PROGRESS") + c("AWAITING_INSPECTION") + c("REWORK_REQUIRED") : "–"}</b><small>In the bay</small></div>
        <div className="stat"><b>{d ? c("READY_FOR_PAYMENT") : "–"}</b><small>Ready for payment</small></div>
        {cash !== null && <div className="stat"><b>{kes(cash)}</b><small>Collected today</small></div>}
        {d?.awaitingPayment !== undefined && <div className="stat"><b>{kes(d.awaitingPayment)}</b><small>Awaiting payment</small></div>}
      </div>
      <h3>Open jobs</h3>
      <div className="wrap"><table>
        <thead><tr><th>Job</th><th>Plate / ID</th><th>Vehicle</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
        <tbody>{jobs.map(j => (
          <tr key={j.id}><td><Link href={`/jobs/${j.id}`}>{j.number}</Link></td><td>{j.vehicle.plate}</td>
            <td>{[j.vehicle.make, j.vehicle.model, j.vehicle.colour].filter(Boolean).join(" ") || "–"}</td><td>{j.customer?.name ?? "Walk-in"}</td>
            <td><Chip status={j.status} /></td><td>{kes(j.total)}</td></tr>
        ))}{!jobs.length && <tr><td colSpan={6}>No open jobs. Start with a check-in.</td></tr>}</tbody>
      </table></div>
    </>
  );
}
