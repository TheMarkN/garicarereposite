"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";

function Row({ s, reload }: { s: any; reload: () => void }) {
  const [price, setPrice] = useState(String(Number(s.price)));
  const [err, setErr] = useState("");
  const patch = async (data: object) => { setErr(""); try { await api(`/api/services/${s.id}`, { method: "PATCH", body: JSON.stringify(data) }); reload(); } catch (e: any) { setErr(e.message); } };
  return (
    <tr style={{ opacity: s.active ? 1 : 0.5 }}>
      <td>{s.name}</td><td>{s.category}</td>
      <td><input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} style={{ width: 110, margin: 0 }} /></td>
      <td><button className="alt2" onClick={() => patch({ price: Number(price) })} disabled={Number(price) === Number(s.price)}>Save price</button>{" "}
        <button className="alt2" onClick={() => patch({ active: !s.active })}>{s.active ? "Deactivate" : "Activate"}</button>{err && <span className="err"> {err}</span>}</td>
    </tr>
  );
}

export default function Services() {
  const [list, setList] = useState<any[]>([]);
  const [n, setN] = useState({ name: "", category: "", price: "" });
  const [err, setErr] = useState("");
  const load = useCallback(() => { api("/api/services?all=1").then(setList).catch(e => setErr(e.message)); }, []);
  useEffect(load, [load]);
  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    try { await api("/api/services", { method: "POST", body: JSON.stringify({ ...n, price: Number(n.price) }) }); setN({ name: "", category: "", price: "" }); load(); }
    catch (e2: any) { setErr(e2.message); }
  }
  return (
    <>
      <h2>Service catalogue</h2>
      <p className="note">Prices include 16% VAT. Price changes apply to new jobs only; existing jobs keep the price quoted.</p>
      <div className="wrap"><table>
        <thead><tr><th>Service</th><th>Category</th><th>Price (KES)</th><th></th></tr></thead>
        <tbody>{list.map(s => <Row key={s.id + s.price + s.active} s={s} reload={load} />)}</tbody>
      </table></div>
      <form className="card wide" onSubmit={add} style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Add a service</h3>
        <div className="g">
          <label>Name<input required value={n.name} onChange={e => setN({ ...n, name: e.target.value })} /></label>
          <label>Category<input required value={n.category} onChange={e => setN({ ...n, category: e.target.value })} placeholder="Wash & Detail" /></label>
          <label>Price (KES)<input required type="number" min="0" value={n.price} onChange={e => setN({ ...n, price: e.target.value })} /></label>
        </div>
        {err && <p className="err" role="alert">{err}</p>}
        <button>Add service</button>
      </form>
    </>
  );
}
