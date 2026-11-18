import { JobStatus } from "@prisma/client";
import { num, round2 } from "./api";

export const OPEN: JobStatus[] = ["CHECKED_IN", "AWAITING_APPROVAL", "APPROVED", "IN_PROGRESS", "AWAITING_INSPECTION", "REWORK_REQUIRED", "READY_FOR_PAYMENT", "PARTIALLY_PAID"];
export const JOB_INCLUDE = {
  vehicle: true, customer: true,
  services: { include: { service: true } },
  approvals: { orderBy: { createdAt: "desc" as const } },
  payments: true, receipts: true,
  history: { orderBy: { createdAt: "asc" as const } },
};
type Line = { unitPrice: unknown; quantity: number; service?: { taxRate: unknown } };
export const jobTotal = (j: { services: Line[] }) => round2(j.services.reduce((a, s) => a + num(s.unitPrice) * s.quantity, 0));
/** Phase 1 assumes VAT-inclusive prices: tax portion = line * rate / (100 + rate). */
export const taxOf = (j: { services: Line[] }) =>
  round2(j.services.reduce((a, s) => { const r = s.service ? num(s.service.taxRate) : 0; return a + (num(s.unitPrice) * s.quantity * r) / (100 + r); }, 0));
export const isApproved = (j: { services: Line[]; approvals: { amount: unknown }[] }) =>
  j.approvals.length > 0 && num(j.approvals[0].amount) >= jobTotal(j);
export const paidSoFar = (j: { payments: { status: string; amount: unknown }[] }) =>
  round2(j.payments.filter(p => p.status === "SUCCESSFUL").reduce((a, p) => a + num(p.amount), 0));

export const RULES: { from: JobStatus; to: JobStatus; perm: string; reason?: boolean }[] = [
  { from: "APPROVED", to: "IN_PROGRESS", perm: "job:progress" },
  { from: "IN_PROGRESS", to: "AWAITING_INSPECTION", perm: "job:progress" },
  { from: "AWAITING_INSPECTION", to: "READY_FOR_PAYMENT", perm: "job:inspect" },
  { from: "AWAITING_INSPECTION", to: "REWORK_REQUIRED", perm: "job:inspect", reason: true },
  { from: "REWORK_REQUIRED", to: "IN_PROGRESS", perm: "job:progress" },
  { from: "PAID", to: "CLOSED", perm: "job:close" },
];
