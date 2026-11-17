# Gari Care (Phase 1)

Next.js 14 + Prisma + Postgres (Neon). Staff screens and API in one project, deployed on Vercel.

## Run it (GitHub Codespaces)
1. `cp .env.example .env`, then fill in DATABASE_URL, DIRECT_URL (same Neon string in both is fine) and AUTH_SECRET (any long random text).
2. `npm install`
3. `npm run db:push`   creates the tables
4. `npm run db:seed`   creates demo users and 8 sample services
5. `npm run dev`       open the link Codespaces shows

Demo logins (password = SEED_PASSWORD in your .env):
admin@garicare.test, attendant@garicare.test, technician@garicare.test, inspector@garicare.test, cashier@garicare.test

## 10-minute test (the admin account can do every step)
1. Sign in as admin. Open **Check-in**. Enter a plate, pick two services, create the job.
2. On the job: **Record customer approval**, then **Start work**, then **Send for inspection**.
3. **Fail: send back for rework** (give a reason), then **Resume work**, send for inspection again, **Pass inspection**.
4. Enter the cash received, **Record cash payment**. The receipt appears. Try **Print receipt**.
5. Check **Close job**, then look at the **Dashboard** and **Jobs** (filter by status).
6. Try these edge cases: check in the same plate twice (duplicate warning); tick "No plate" (temporary ID); add extra work mid-job (approval is required again); try paying less than the amount due (rejected).
7. Sign out and sign in as `cashier@garicare.test`: you can take payment but not create jobs. Try `attendant@garicare.test` and `inspector@garicare.test` the same way.

## Deploy on Vercel
Import the GitHub repo and add DATABASE_URL, DIRECT_URL and AUTH_SECRET as environment variables. Never commit `.env`.
Change the demo passwords and remove the demo users before real use.

See API.md for the endpoint list.
