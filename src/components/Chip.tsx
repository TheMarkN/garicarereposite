import { STATUS } from "@/lib/labels";
export default function Chip({ status }: { status: string }) {
  const cls = status === "PAID" || status === "CLOSED" ? "ok" : status === "AWAITING_APPROVAL" || status === "REWORK_REQUIRED" ? "warn" : status === "CANCELLED" ? "bad" : "";
  return <span className={`chip ${cls}`}>{STATUS[status] || status}</span>;
}
