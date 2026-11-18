"use client";
import { useState } from "react";

export default function Login() {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.get("email"), password: f.get("password") }) });
    if (r.ok) { window.location.href = "/dashboard"; return; }
    setErr((await r.json().catch(() => ({}))).error || "Login failed"); setBusy(false);
  }
  return (
    <form className="card" onSubmit={submit}>
      <h1 style={{ marginTop: 0 }}>Gari Care</h1>
      <label>Email<input name="email" type="email" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      {err && <p className="err" role="alert">{err}</p>}
      <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
