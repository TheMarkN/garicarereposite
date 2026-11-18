"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { STATUS, kes, dt } from "@/lib/labels";
import Chip from "@/components/Chip";

export default function Jobs() {
  const [st, setSt] = useState("open");
  const [jobs, setJobs] = useState<any[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => { api(`/api/jobs?status=${st}`).then(setJobs).catch(e => setErr(e.message)); }, [st]);
  return (
    <>
      <div className="bar"><h2 style={{ margin: 0 }}>Jobs</h2>
        <select value={st} onChange={e => setSt(e.target.value)} style={{ width: "auto", marginLeft: "auto" }}>
          <option value="open">Open jobs</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select></div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="wrap"><table>
        <thead><tr><th>Job</th><th>Plate / ID</th><th>Customer</th><th>Services</th><th>Status</th><th>Total</th><th>Opened</th></tr></thead>
        <tbody>{jobs.map(j => (
          <tr key={j.id}><td><Link href={`/jobs/${j.id}`}>{j.number}</Link></td><td>{j.vehicle.plate}</td><td>{j.customer?.name ?? "Walk-in"}</td>
            <td>{j.services.map((s: any) => s.service.name).join(", ")}</td><td><Chip status={j.status} /></td><td>{kes(j.total)}</td><td>{dt(j.createdAt)}</td></tr>
        ))}{!jobs.length && <tr><td colSpan={7}>No jobs found.</td></tr>}</tbody>
      </table></div>
    </>
  );
}
