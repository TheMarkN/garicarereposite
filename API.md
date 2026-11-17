# Gari Care API (Phase 1)

All routes need a login cookie unless marked public. Roles: ATTENDANT, TECHNICIAN, INSPECTOR, CASHIER, ADMIN.

| Method and path | Who | What |
|---|---|---|
| GET /api/services (?all=1 admin) | any staff | Service list |
| POST /api/services | admin | Create service |
| PATCH /api/services/:id | admin | Edit service (price changes are audited) |
| DELETE /api/services/:id | admin | Deactivate (never deletes) |
| GET /api/vehicles?q= | any staff | Search by plate, phone or name |
| GET /api/jobs?status=open | any staff | Job board |
| POST /api/jobs | attendant, admin | Check-in: plate or noPlate, customer, serviceIds. 409 DUPLICATE_PLATE unless force:true |
| GET /api/jobs/:id | any staff | Job detail, totals, approval state (id or JC-0001) |
| POST /api/jobs/:id/approve | attendant, admin | Record customer approval of the current total |
| POST /api/jobs/:id/services | attendant, admin | Add extra work (forces re-approval) |
| POST /api/jobs/:id/status | per transition | {to, reason?}: start, send for inspection, pass, rework, cancel, close |
| POST /api/jobs/:id/payments/cash | cashier, admin | {tendered}: full cash payment, creates receipt |
| GET /api/jobs/:id/receipt | any staff | Receipt data (audited) |
| GET /api/dashboard | any staff | Counts; money totals for cashier/admin only |
| GET /api/bookings | attendant, admin | Website bookings |
| POST /api/public/bookings | public | Website booking form |
| GET /api/public/track?ref=&phone= | public | Customer job tracking |

Job flow: AWAITING_APPROVAL -> (approve) APPROVED -> IN_PROGRESS -> AWAITING_INSPECTION -> READY_FOR_PAYMENT -> (cash) PAID -> CLOSED.
