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
| Auth: signup, login, email confirmation | `done` | Supabase Auth |
| Auth: password reset flow | `done` | |
| Middleware: role-based route protection | `done` | job_seeker / company / admin roles |
| Landing page (full multi-section) | `done` | |
| Job seeker onboarding wizard | `done` | |
| Company onboarding wizard | `done` | |
| Job seeker profile (view + edit) | `done` | username-based public URL |
| Avatar upload | `done` | public Supabase Storage bucket |
| CV upload | `done` | upload works; path stored in job_seeker_profiles |
| Projects, skills, badges on profile | `done` | |
| Job discovery (search + filter) | `done` | |
| Apply to job (cover letter optional) | `done` | |
| View my applications list | `done` | |
| Company profile setup | `done` | |
| Company: create/view/edit job listings | `done` | |
| Company: view applicants per job | `done` | |
| Company dashboard stats | `done` | |
| AI mock interview simulator | `done` | OpenAI gpt-4o-mini |
| Assessments UI (job seeker side) | `done` | |
| Database restructure (base + extension tables) | `done` | profiles + job_seeker_profiles + admins |

---

## Phase 2 — Core MVP Gaps (Current Focus)

Priority order is top-to-bottom.

| Feature | Status | Notes |
|---|---|---|
| **Company applicant management** | `in-progress` | Spec written and confirmed |
| CV signed URL (security fix) | `planned` | Part of applicant management |
| Send assessments to applicants | `planned` | Server action exists; UI missing |
| Assessment results stored + viewable | `planned` | DB schema ready |
| Applicant status workflow | `planned` | Action exists; UI + auth check missing |
| Platform-level assessments | `planned` | New concept — spec not yet written |

---

## Phase 3 — Quality & Polish

| Feature | Status | Notes |
|---|---|---|
| Skill-based job matching (rule-based) | `planned` | Match job requirements to profile skills |
| Dynamic portfolio concept | `planned` | Definition pending from user |
| Saved/bookmarked jobs (DB-backed) | `planned` | No DB table yet |
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
