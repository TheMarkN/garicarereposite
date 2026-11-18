"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client";
import { can } from "@/lib/perms";
import { useMe } from "@/lib/useMe";
import { kes, dt } from "@/lib/labels";
import Chip from "@/components/Chip";

const EDITABLE = ["AWAITING_APPROVAL", "APPROVED", "IN_PROGRESS", "AWAITING_INSPECTION", "REWORK_REQUIRED"];

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const [job, setJob] = useState<any>(null);
  const [svcs, setSvcs] = useState<any[]>([]);
  const [receipt, setReceipt] = useState<any>(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [tendered, setTendered] = useState(""); const [extra, setExtra] = useState("");

  const load = useCallback(async () => {
    try {
      const j = await api(`/api/jobs/${id}`); setJob(j); setTendered(String(j.due));
      setReceipt(j.receipts?.length ? await api(`/api/jobs/${j.id}/receipt`) : null);
    } catch (e: any) { setErr(e.message); }
  }, [id]);
  useEffect(() => { load(); api("/api/services").then(setSvcs).catch(() => {}); }, [load]);

  const ok = (a: string) => (me ? can(me.role, a) : false);
  async function act(fn: () => Promise<unknown>) {
    setBusy(true); setErr("");
    try { await fn(); await load(); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  const post = (path: string, body?: unknown) => api(`/api/jobs/${job.id}${path}`, { method: "POST", body: JSON.stringify(body ?? {}) });
  const setStatus = (to: string, reason?: string) => act(() => post("/status", { to, reason }));
  const askThen = (msg: string, to: string) => { const r = prompt(msg); if (r && r.trim()) setStatus(to, r.trim()); };

  if (!job) return err ? <p className="err" role="alert">{err}</p> : <p>Loading…</p>;
  const s: string = job.status;
  return (
    <>
      <p className="noprint"><Link href="/jobs">&larr; All jobs</Link></p>
      <div className="bar"><h2 style={{ margin: 0 }}>{job.number}</h2><Chip status={s} /></div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="cols">
        <div>
          <div className="card wide">
            <dl>
              <dt>Plate / ID</dt><dd>{job.vehicle.plate}{job.vehicle.isTemp && " (temporary)"}</dd>
              <dt>Vehicle</dt><dd>{[job.vehicle.make, job.vehicle.model, job.vehicle.colour].filter(Boolean).join(" ") || "–"}</dd>
              <dt>Customer</dt><dd>{job.customer ? `${job.customer.name} ${job.customer.phone ?? ""}` : "Walk-in"}</dd>
              {job.notes && <><dt>Notes</dt><dd>{job.notes}</dd></>}
            </dl>
            <div style={{ marginTop: 14 }}>
              {job.services.map((x: any) => (
                <div className="line" key={x.id}><span>{x.service.name}{x.quantity > 1 && ` × ${x.quantity}`}{x.isExtra && " (extra)"}</span><span>{kes(Number(x.unitPrice) * x.quantity)}</span></div>
              ))}
              <div className="line"><b>Total</b><b>{kes(job.total)}</b></div>
              {job.paid > 0 && <div className="line"><span>Paid</span><span>{kes(job.paid)}</span></div>}
            </div>
            <p className="note">{job.approved ? "Customer approval recorded for the current total." : "Customer approval is needed before work starts."}</p>
          </div>

          {receipt && (
            <div className="card wide receipt">
              <h3 style={{ marginTop: 0 }}>Gari Care receipt {receipt.receiptNumber}</h3>
              <p className="note">{dt(receipt.issuedAt)} · Job {receipt.jobNumber} · {receipt.plate} · {receipt.customer}</p>
              {receipt.lines.map((l: any, i: number) => <div className="line" key={i}><span>{l.name}{l.quantity > 1 && ` × ${l.quantity}`}</span><span>{kes(l.lineTotal)}</span></div>)}
              <div className="line"><span>VAT included</span><span>{kes(receipt.vatIncluded)}</span></div>
              <div className="line"><b>Total paid</b><b>{kes(receipt.total)}</b></div>
              <div className="line"><span>Method</span><span>{receipt.paymentMethod}</span></div>
              {receipt.tendered != null && <div className="line"><span>Cash received / change</span><span>{kes(receipt.tendered)} / {kes(receipt.change)}</span></div>}
              <p className="note">{receipt.note}</p>
              <div className="noprint"><button onClick={() => window.print()}>Print receipt</button></div>
            </div>
          )}
        </div>

        <div className="noprint">
          <div className="card wide">
            <h3 style={{ marginTop: 0 }}>Actions</h3>
            <div className="stack">
              {s === "AWAITING_APPROVAL" && ok("job:approve") && <button disabled={busy} onClick={() => act(() => post("/approve", { method: "in-person" }))}>Record customer approval ({kes(job.total)})</button>}
              {s === "APPROVED" && ok("job:progress") && <button disabled={busy} onClick={() => setStatus("IN_PROGRESS")}>Start work</button>}
              {s === "IN_PROGRESS" && ok("job:progress") && <button disabled={busy} onClick={() => setStatus("AWAITING_INSPECTION")}>Send for inspection</button>}
              {s === "AWAITING_INSPECTION" && ok("job:inspect") && <>
                <button disabled={busy} onClick={() => setStatus("READY_FOR_PAYMENT")}>Pass inspection</button>
                <button className="alt2" disabled={busy} onClick={() => askThen("What needs to be fixed?", "REWORK_REQUIRED")}>Fail: send back for rework</button></>}
              {s === "REWORK_REQUIRED" && ok("job:progress") && <button disabled={busy} onClick={() => setStatus("IN_PROGRESS")}>Resume work</button>}
              {s === "READY_FOR_PAYMENT" && ok("payment:cash") && (
                <form onSubmit={e => { e.preventDefault(); act(() => post("/payments/cash", { tendered: Number(tendered) })); }}>
                  <label>Cash received (KES), due {kes(job.due)}<input type="number" min="0" value={tendered} onChange={e => setTendered(e.target.value)} /></label>
                  <p className="note">Cash only in Phase 1. M-Pesa and card arrive in Phase 2.</p>
                  <button disabled={busy}>Record cash payment</button>
                </form>)}
              {s === "PAID" && ok("job:close") && <button disabled={busy} onClick={() => setStatus("CLOSED")}>Close job</button>}
              {!["PAID", "CLOSED", "CANCELLED"].includes(s) && ok("job:cancel") && <button className="alt2" disabled={busy} onClick={() => askThen("Reason for cancelling?", "CANCELLED")}>Cancel job</button>}
              {s === "READY_FOR_PAYMENT" && !ok("payment:cash") && <p className="note">Waiting for the cashier.</p>}
            </div>
            {EDITABLE.includes(s) && ok("job:create") && (
              <form className="bar" style={{ marginTop: 16 }} onSubmit={e => { e.preventDefault(); if (extra) act(async () => { await post("/services", { serviceId: extra }); setExtra(""); }); }}>
                <select value={extra} onChange={e => setExtra(e.target.value)} style={{ flex: 1, marginTop: 0 }}>
                  <option value="">Add extra work…</option>
                  {svcs.filter(x => !job.services.some((j: any) => j.serviceId === x.id)).map(x => <option key={x.id} value={x.id}>{x.name} ({kes(x.price)})</option>)}
                </select>
                <button className="alt2" disabled={busy || !extra}>Add</button>
              </form>)}
            {EDITABLE.includes(s) && ok("job:create") && <p className="note">Adding work needs a new customer approval.</p>}
          </div>
          <div className="card wide">
            <h3 style={{ marginTop: 0 }}>History</h3>
            <ul className="log">{job.history.map((h: any) => <li key={h.id}>{dt(h.createdAt)}: {h.status.replace(/_/g, " ").toLowerCase()}{h.reason ? ` (${h.reason})` : ""}</li>)}</ul>
          </div>
        </div>
      </div>
    </>
  );
}
