# Product Roadmap

Status labels: `done` | `partial` | `in-progress` | `planned` | `out-of-scope`

---

## MVP Definition

The academic deadline deliverable is one complete end-to-end hiring workflow:

```
Company posts job
  → Job seeker applies
  → Company views applicants
  → Company reviews profile + CV + assessments
  → Company updates applicant status
```

Everything else is secondary to this loop being fully functional.

---

## Phase 1 — Foundation (Done)

| Feature | Status | Notes |
|---|---|---|
| Auth: signup, login, email confirmation | `done` | Supabase Auth — email verification enabled; `NEXT_PUBLIC_SITE_URL` required |
| Auth: password reset flow | `done` | |
| Middleware: role-based route protection | `done` | job_seeker / company / admin roles |
| Landing page (full multi-section) | `done` | |
| Job seeker onboarding wizard | `done` | |
| Company onboarding wizard | `done` | |
| Job seeker profile (view + edit) | `done` | username-based public URL |
| Avatar upload | `done` | public Supabase Storage bucket |
| CV upload | `done` | storage path saved; signed URL generated at read time |
| Projects, skills, badges on profile | `done` | |
| Job discovery (search + filter) | `done` | |
| Apply to job (cover letter optional) | `done` | |
| View my applications list | `done` | status filter tabs |
| Company profile setup | `done` | |
| Company: create/view/edit job listings | `done` | includes required skills via SkillPicker |
| Company: view applicants per job | `done` | status filter with count badges |
| Company dashboard stats | `done` | |
| AI mock interview simulator | `done` | OpenAI gpt-4o-mini |
| Database restructure (base + extension tables) | `done` | profiles + job_seeker_profiles + admins |

---

## Phase 2 — Core MVP Gaps (Done)

| Feature | Status | Notes |
|---|---|---|
| Company applicant management | `done` | Full profile view, status transitions, auth guard |
| CV signed URL security fix | `done` | Path stored at upload; signed URL generated server-side via `lib/storage/cv.ts` |
| Send assessments to applicants | `done` | Company creates assessment on applicant detail page |
| Assessment results stored + viewable | `done` | Submission saved; company sees answers + score |
| Applicant status workflow | `done` | `ALLOWED_TRANSITIONS` map enforced on server and client |
| Skill-based job matching | `done` | `job_to_skills` junction; match ratio badge on job cards |
| Saved / bookmarked jobs | `done` | `saved_jobs` table; save/unsave actions; dedicated page |

---

## Phase 3 — Quality & Polish

| Feature | Status | Notes |
|---|---|---|
| Profile missing `job_seeker_profiles` row | `done` | Graceful fallback in `getProfileByUsername` — renders with empty fields |
| Profile redirect bug fix | `done` | Empty username treated as null → redirects to onboarding |
| Email verification on signup | `done` | Supabase confirmation email; confirm route handles both PKCE and OTP flows |
| `job_seeker_profiles` RLS policies | `done` | Added SELECT/INSERT/UPDATE for job seekers + SELECT for companies viewing their applicants |
| `admins` RLS policies | `done` | Admins can only read their own row |
| Applicants page showing 0 results | `done` | FK hint pointed to `auth.users` not `profiles`; fixed with two-step fetch in `getJobApplicants` and `getApplicationById` |
| Email notifications (status change) | `done` | Edge Function built; deploy + webhook setup required (see `docs/03-features/email-notifications.md`) |
| Settings pages (job seeker + company) | `planned` | Sidebar links are dead |
| Sidebar collapse button | `planned` | TODO in components/sidebar.tsx |
| Pagination on job listings | `planned` | "Show More" not wired to API |
| Company profile edit | `planned` | Create works; edit UX unclear |
| Admin panel (basic) | `planned` | Role exists in DB; no UI |

---

## Out of Scope for MVP

| Feature | Reason |
|---|---|
| Real-time messaging | Post-MVP; needs messages table + Supabase Realtime |
| Real-time notifications | Post-MVP; needs notifications table |
| Arabic / RTL | Post-MVP |
| Advanced recommendation AI | Post-MVP |
| Mobile app | Post-MVP |
| Mid-career professional features | Post-MVP |
