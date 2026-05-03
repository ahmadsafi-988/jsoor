# Feature: Admin

> ⚠️ **LEGACY — OUTDATED.** Use `docs/05-features-specification.md` (F-17) instead. This file describes "approve/reject job postings" as the admin approach — that decision was reversed. Admin now locks/unlocks, verifies companies, blocks/suspends users, and reviews reports. See decisions log for full context.

**Status:** Foundation done — panel not yet built
**Source:** Confirmed by user interview (2026-04-21).

---

## What Admins Can Do (Current State)

- Visit `/auth/login` and log in with credentials set manually in Supabase Auth dashboard
- After login → redirected to `/admin` (placeholder page — "Admin panel coming soon")

## What Admins Cannot Do

- Sign up through the app — there is no admin signup form and never will be
- Access `/job-seeker/*` or `/company/*` — middleware redirects them to `/admin`

---

## How Admin Accounts Are Created

Admin accounts are created manually by the developer only. There is no self-registration flow.

**Steps:**
1. Go to Supabase Auth dashboard → Authentication → Users → Add user
2. Fill in email + password
3. Copy the generated UUID
4. Run:
   ```sql
   INSERT INTO admins (id) VALUES ('<uuid>');
   ```
5. Trigger `on_admin_inserted` fires automatically → sets `profiles.role = 'admin'`

---

## Planned Admin Responsibilities

From product definition — to be built post-MVP:

- **Job moderation** — approve, edit, or reject job postings before they go live
- **Company oversight** — verify companies are legitimate before they can post jobs
- **User monitoring** — handle reports and suspicious activity
- **Platform assessments** — manage platform-level assessments

---

## Technical Notes

- `admins` table: `id` (FK → profiles), `added_at`
- `profiles.role` = `'admin'` for all admin users
- Middleware guard: DB query runs only when admin hits `/job-seeker/*` or `/company/*`
- `/admin/page.tsx` does a second server-side role check as a safety net

---

## Files

| File | Purpose |
|---|---|
| `src/app/admin/page.tsx` | Placeholder admin page with role guard |
| `lib/supabase/middleware.ts` | Redirects admins away from job-seeker/company routes |
| DB: `admins` table | Extension table for admin users |
| DB: `on_admin_inserted` trigger | Auto-sets role = 'admin' in profiles on insert |
