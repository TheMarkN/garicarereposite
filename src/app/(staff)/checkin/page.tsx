"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import { kes } from "@/lib/labels";

export default function CheckInPage() { return <Suspense fallback={<p>Loading…</p>}><CheckIn /></Suspense>; }

function CheckIn() {
  const router = useRouter();
  const qs = useSearchParams();
  const bookingId = qs.get("booking");
  const [svcs, setSvcs] = useState<any[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [f, setF] = useState({ plate: qs.get("plate") || "", noPlate: qs.get("noPlate") === "1", make: "", model: "", colour: "", customerName: qs.get("name") || "", phone: qs.get("phone") || "", consent: false, notes: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    api("/api/services").then(l => {
      setSvcs(l);
      const ids = (qs.get("services") || "").split(",").filter(Boolean);
      if (ids.length) setSel(new Set(ids.filter(i => l.some((s: any) => s.id === i))));
    }).catch(e => setErr(e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = (k: string, v: unknown) => setF(p => ({ ...p, [k]: v }));
  const by: Record<string, any[]> = {}; svcs.forEach(s => (by[s.category] = by[s.category] || []).push(s));
  const total = svcs.filter(s => sel.has(s.id)).reduce((a, s) => a + Number(s.price), 0);
  const toggle = (id: string) => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function send(force: boolean) {
    const j = await api("/api/jobs", { method: "POST", body: JSON.stringify({ ...f, serviceIds: [...sel], force, bookingId }) });
    router.push(`/jobs/${j.id}`);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await send(false); }
    catch (e1: any) {
      if (e1.data?.code === "DUPLICATE_PLATE" && confirm(`${e1.data.jobNumber} is already open for this plate. Create another job?`)) {
        try { await send(true); return; } catch (e2: any) { setErr(e2.message); }
      } else setErr(e1.message);
    } finally { setBusy(false); }
  }
  return (
    <>
      <h2>New check-in</h2>
      {bookingId && <p className="note">From website booking {qs.get("ref")}. Check the details, then create the job card.</p>}
      <form className="card wide" onSubmit={submit}>
        <div className="g">
          <label>Registration plate<input value={f.plate} disabled={f.noPlate} onChange={e => set("plate", e.target.value)} placeholder="KDG 482T" /></label>
          <label className="inl"><input type="checkbox" checked={f.noPlate} onChange={e => set("noPlate", e.target.checked)} /> No plate: issue a temporary ID</label>
          <label>Make<input value={f.make} onChange={e => set("make", e.target.value)} placeholder="Toyota" /></label>
          <label>Model<input value={f.model} onChange={e => set("model", e.target.value)} placeholder="Prado" /></label>
          <label>Colour<input value={f.colour} onChange={e => set("colour", e.target.value)} /></label>
          <label>Customer name<input value={f.customerName} onChange={e => set("customerName", e.target.value)} /></label>
          <label>Phone<input value={f.phone} inputMode="tel" onChange={e => set("phone", e.target.value)} placeholder="07xx xxx xxx" /></label>
          <label className="inl"><input type="checkbox" checked={f.consent} onChange={e => set("consent", e.target.checked)} /> Customer agrees we keep their details for service records</label>
        </div>
        {Object.entries(by).map(([cat, list]) => (
          <div key={cat}><p className="note">{cat}</p>
            <div className="svcs">{list.map(s => (
              <label key={s.id} className="chk"><span><input type="checkbox" checked={sel.has(s.id)} onChange={() => toggle(s.id)} /> {s.name}</span><span>{kes(s.price)}</span></label>
            ))}</div></div>
        ))}
        <label>Notes or pre-existing damage<input value={f.notes} onChange={e => set("notes", e.target.value)} /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <div className="bar"><button disabled={busy}>{busy ? "Creating…" : "Create job card"}</button><span className="est">Estimate {kes(total)}</span></div>
      </form>
    </>
  );
}
