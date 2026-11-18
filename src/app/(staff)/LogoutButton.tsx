"use client";
export default function LogoutButton() {
  return <button className="alt" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}>Sign out</button>;
}
