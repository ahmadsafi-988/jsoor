# 04 — User Roles and Permissions

> Last updated: 2026-05-03

---

## Roles

| Role | DB Value | Description |
|---|---|---|
| Job Seeker | `job_seeker` | Students/graduates; browse, apply, take assessments |
| Company | `company` | Post jobs, manage applicants, send assessments |
| Admin | `admin` | Platform moderator; oversees integrity |

---

## Role Assignment

1. **Job Seeker**: Default role. User signs up via `/auth/sign-up` → email confirmation → `/job-seeker/onboarding`. The `upsertProfile` action sets `role = 'job_seeker'` implicitly (DB default).

2. **Company**: User signs up via company sign-up flow → email confirmation → `/company/onboarding`. The `upsertCompany` action explicitly sets `role = 'company'` in the `profiles` upsert.

3. **Admin**: Assigned manually by a superadmin via DB function `promote_to_admin` or direct insert into `admins` table. A trigger updates `profiles.role = 'admin'`.

---

## Route Guards

### Middleware (`src/middleware.ts` → `lib/supabase/middleware.ts`)

```
Public routes (no auth required):
  /
  /auth/*
  /job-seeker/profile/* (public profiles)
  /company/onboarding

Protected routes:
  All others → redirect to /auth/login

Role redirect:
  If admin accesses /job-seeker/* or /company/* → redirect to /admin
```

### Page-level Guards
- `/admin/page.tsx` — verifies `role = 'admin'`, otherwise redirects to `/`
- Company pages — check `company_owns_application` flag before rendering applicant detail

---

## Permissions Matrix

### Job Seeker

| Action | Allowed |
|---|---|
| Browse active jobs | Yes |
| Apply to job (with cover letter) | Yes |
| Save/unsave jobs | Yes |
| Report a job | Yes |
| View own applications | Yes |
| View own assessments | Yes |
| Take assigned assessment | Yes |
| View assessment results (after release) | Yes |
| View own profile | Yes |
| Edit own profile (name, bio, education, skills, CV, avatar, projects, badges) | Yes |
| View other job seekers' public profiles | Yes |
| Post jobs | No |
| View other applicants | No |
| Send assessments | No |
| Access company dashboard | No |
| Access admin panel | No |

### Company

| Action | Allowed |
|---|---|
| Post jobs | Yes |
| Edit/delete own jobs | Yes |
| View applicants for own jobs | Yes |
| View applicant full profile (incl. CV) | Yes |
| Update applicant status | Yes (own applicants only) |
| Send assessment to applicant | Yes |
| Review submitted assessments | Yes |
| Release assessment results | Yes |
| Create/edit/delete assessment templates | Yes |
| Load a template when sending an assessment | Yes |
| View company dashboard | Yes |
| Edit own company profile | Yes |
| Receive in-app notifications (new applications, submitted assessments) | Yes |
| Send and receive messages with applicants | Yes |
| Browse job feed | No |
| Apply to jobs | No |
| Access admin panel | No |

### Admin

| Action | Allowed |
|---|---|
| Access admin panel | Yes |
| View dashboard stats (users, companies, jobs, applications) | Yes |
| Lock a job (`admin_locked = true`) | Yes |
| Unlock a job | Yes |
| Verify a company (`is_verified = true`) | Yes |
| Unverify a company | Yes |
| Block a user (`is_blocked = true`) | Yes |
| Suspend a user (`is_suspended = true`) + set reason | Yes |
| View all reported jobs | Yes |
| Mark a report as reviewed or dismissed | Yes |
| Lock a job directly from the reports view | Yes |
| View admin audit log (all admin actions) | Yes |
| Access job seeker or company dashboards | No (redirected to /admin) |

---

## RLS Enforcement

Row Level Security is the database enforcement layer. Key policies:

- **`job_seeker_profiles`**: Job seekers can only read/write their own row. Companies can read profiles of their own applicants.
- **`jobs`**: Public can read active jobs. Companies can only write their own jobs.
- **`job_applications`**: Applicants can see their own. Companies can see applications for their jobs. Companies can update status; applicants can only submit assessments.
- **`assessments`**: Company sees own assessments; applicant sees assessments on their own applications. Applicant can only update from `pending → submitted`.
- **`saved_jobs`**: Strictly user-scoped.

---

## Current Gaps / Risks

| Gap | Risk |
|---|---|
| No middleware guard for admin-only routes beyond `/admin` | Admin dashboard is future-proofed but not currently a vector |
| Company can access any applicant by applicationId if they guess the UUID | RLS `company_owns_application` check exists in `getApplicationWithApplicantProfile` but only at data layer |
| No rate limiting on apply/save actions | Could be abused but low priority for MVP |
| OPENAI_API_KEY in server-side env only; not exposed to client | Correct and secure |
