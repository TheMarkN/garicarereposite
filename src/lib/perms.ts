export type Role = "ATTENDANT" | "TECHNICIAN" | "INSPECTOR" | "CASHIER" | "ADMIN";
// Who may do what. The API enforces these; the screens use them only to show the right buttons.
const P: Record<string, Role[]> = {
  "service:manage": ["ADMIN"],
  "customer:write": ["ATTENDANT", "ADMIN"],
  "job:create": ["ATTENDANT", "ADMIN"],
  "job:approve": ["ATTENDANT", "ADMIN"],
  "job:progress": ["ATTENDANT", "TECHNICIAN", "ADMIN"],
  "job:inspect": ["INSPECTOR", "ADMIN"],
  "job:cancel": ["ADMIN"],
  "job:close": ["ATTENDANT", "CASHIER", "ADMIN"],
  "payment:cash": ["CASHIER", "ADMIN"],
  "payment:refund": ["ADMIN"],
  "booking:view": ["ATTENDANT", "ADMIN"],
  "report:view": ["ADMIN"],
  "user:manage": ["ADMIN"],
};
export const can = (role: Role, action: string) => P[action]?.includes(role) ?? false;
