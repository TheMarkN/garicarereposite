export const STATUS: Record<string, string> = {
  CHECKED_IN: "Checked in", AWAITING_APPROVAL: "Awaiting approval", APPROVED: "Approved", IN_PROGRESS: "In progress",
  AWAITING_INSPECTION: "Awaiting inspection", REWORK_REQUIRED: "Rework required", READY_FOR_PAYMENT: "Ready for payment",
  PARTIALLY_PAID: "Partially paid", PAID: "Paid", CLOSED: "Closed", CANCELLED: "Cancelled",
};
export const kes = (n: unknown) => "KES " + Math.round(Number(n) || 0).toLocaleString("en-KE");
export const dt = (d: string) => new Date(d).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
