# 01 — Current System State

> Last updated: 2026-05-03 | Source: Full codebase analysis

---

## Summary

The project is substantially built. The core hiring workflow (job → apply → assess → decide) is complete end-to-end. Several secondary features (messages, notifications) have UI shells with no backend. The admin panel is a stub. A few areas have structural debt that needs cleanup.

---

## What Is Implemented

### Authentication
- [x] Job seeker sign-up with email confirmation (redirects to onboarding)
- [x] Company sign-up with email confirmation (redirects to company onboarding)
- [x] Login / logout
- [x] Forgot password / update password flow
- [x] Role-based route guards in `src/middleware.ts`
- [x] Admin redirect guard (admin users → `/admin`)

### Job Seeker Onboarding (`/job-seeker/onboarding`)
- [x] 4-step wizard: Identity → Education → Skills → Done
- [x] Avatar upload to Supabase storage (`avatars` bucket)
- [x] CV upload to Supabase storage (`cvs` bucket)
- [x] University autocomplete search from `universities` table
- [x] Single-write architecture (all DB writes committed on final step)
- [x] Username uniqueness check with debounce

### Job Seeker Profile (`/job-seeker/profile/[username]`)
- [x] Public profile page (accessible without login)
- [x] Header card: avatar, name, degree, location, edit button (own profile only)
- [x] About/bio section
- [x] Projects section with timeline layout
- [x] Skills section with tags
- [x] Badges/certifications section
- [x] CV download via Supabase signed URL
- [x] Edit profile (`/job-seeker/profile/[username]/edit`)

### Job Feed (`/job-seeker/home`)
- [x] Active jobs listing (sorted by skill match ratio)
- [x] Skill matching: matchCount / matchTotal displayed per job
- [x] Match badges: "Strong Match" (≥70%), "Partial Match" (≥40%)
- [x] Filter tabs: All, Best Match, Full-time, Remote, Hybrid, Internship
- [x] Search by role or company name
- [x] Apply to job with optional cover letter (inline form)
- [x] Save/unsave jobs (persisted to DB)
- [x] "Show More" button (renders but has no pagination logic)

### Job Applications (`/job-seeker/job-applications`)
- [x] List of applied jobs with status badge
- [x] Application status: applied, under_review, assessment_sent, assessment_completed, shortlisted, rejected

### Saved Jobs (`/job-seeker/saved-jobs`)
- [x] View saved jobs
- [x] Unsave from list

### Assessments — Job Seeker (`/job-seeker/assessments`)
- [x] View all assessments linked to applications
- [x] Assessment instructions screen (question count, time limit, deadline)
- [x] Assessment taker: MCQ, True/False, Open text question types
- [x] Countdown timer (auto-submit on timeout)
- [x] One-way navigation (no going back)
- [x] Auto-score for MCQ and True/False on submission
- [x] Results view after company releases (score, per-question breakdown)
- [x] Feedback text from company

### AI Interview Simulator (`/job-seeker/interview-simulator`)
- [x] Setup form: target role, skills, interview type, difficulty
- [x] Question generation via OpenAI GPT-4o-mini (`/api/ai`)
- [x] Q&A loop with progress indicator
- [x] AI-evaluated feedback per question (score 1-10, strengths, improvements)
- [x] Overall summary
- [ ] **BLOCKED**: `OPENAI_API_KEY` not set in `.env.local` — simulator will fail at runtime

### Messages (`/job-seeker/messages`)
- [x] Full UI: conversation list, chat panel, send input
- [ ] **NO BACKEND**: All data is hardcoded. No `messages` table. Not connected to DB.

### Notifications (`/job-seeker/notifications`)
- [x] Full UI: grouped by Today / Yesterday / Earlier
- [ ] **NO BACKEND**: All data is hardcoded. No `notifications` table.

---

### Company Onboarding (`/company/onboarding`)
- [x] Company name, username, industry, location, description
- [x] Creates row in `companies` + `profiles` tables

### Company Dashboard (`/company/home`)
- [x] Stats: total jobs, active jobs, total applications, pending assessments
- [x] Recent jobs list (last 5)
- [x] Recent assessments list (last 3)
- [x] Quick action cards: Post a Job, Assessments

### Company Jobs (`/company/jobs`)
- [x] List all company jobs with status
- [x] Create new job (`/company/jobs/new`): title, description, location, type, salary, requirements, skills picker
- [x] Edit job (`/company/jobs/[jobId]`): same fields + active toggle
- [x] Delete job
- [x] Skill picker component for attaching required skills

### Company Applicants
- [x] Applicants per job (`/company/jobs/[jobId]/applicants`)
- [x] Applicant detail (`/company/applicants/[applicationId]`):
  - Full applicant profile (bio, education, skills, projects, badges)
  - CV download (signed URL)
  - Application status management (state machine)
  - Send assessment form
  - Review submitted assessment (score override, feedback)
  - Release assessment results to applicant

### Company Assessments (`/company/assessments`)
- [x] List all assessments across all applications
- [x] Filter by status (pending / submitted / reviewed)
- [x] Review individual assessments

### Company Profile (`/company/profile`)
- [ ] **UNKNOWN**: Page file exists but not fully analyzed — may be stub

### Email Notifications (Supabase Edge Function)
- [x] Edge function `email-notification` exists in `supabase/functions/`
- [x] Sends emails on status changes: reviewed, shortlisted, accepted, rejected
- [ ] **UNKNOWN**: Whether the trigger is wired in Supabase dashboard

### Admin (`/admin`)
- [x] Auth guard (only `role = admin` can access)
- [ ] **STUB**: Just renders "Admin panel coming soon"

---

## What Is Missing / Incomplete

| Feature | Status | Notes |
|---|---|---|
| Real-time messaging | Missing | `conversations`/`messages` tables not created yet; job seeker UI-only shell exists; no company page |
| In-app notifications | Missing | `notifications` table not created yet; job seeker UI-only shell exists; no company page |
| Admin panel | Stub | No admin functionality — "coming soon" |
| Job reports | Missing | `job_reports` table exists in DB; no UI or code |
| Admin audit log | Missing | `admin_audit_logs` table exists in DB; no code to write or read it |
| Assessment templates | Missing | `assessment_templates` table exists in DB; no UI or code |
| Job pagination | Partial | "Show More" button does nothing |
| Company profile edit | Unknown | Page exists, not verified |
| Company notifications page | Missing | No `/company/notifications` page |
| Company messages page | Missing | No `/company/messages` page |
| Public job detail page | Missing | No `/jobs/[id]` public route |
| OpenAI API key | Missing | `OPENAI_API_KEY` not in `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | Missing | Used in auth redirects, not set |
| Platform-level assessments | Missing | Only company assessments exist; no `platform_assessments` table |

---

## Structural Issues

### 1. Duplicate / Orphaned Routes
- `src/app/(marketing)/` and `src/app/marketing/` — two landing page routes
- `src/app/(marketing)/RENAMEDTODISABLElayout.tsx` — disabled layout not cleaned up
- `src/app/Company/` (capital C) — old draft, just a RDME.txt
- `src/app/Administrator/` — old draft, just a RDME.txt

### 2. Status Value Inconsistency
- `ALLOWED_TRANSITIONS` in `actions.ts` uses: `applied`, `under_review`, `assessment_sent`, `assessment_completed`, `shortlisted`, `rejected`
- Old docs say: `pending`, `reviewed`, `shortlisted`, `accepted`, `rejected`
- The actual live DB status values need to be verified against these

### 3. `revalidatePath` Mismatch
- Some actions call `revalidatePath("/job-seeker/profile")` — but the actual page is `/job-seeker/profile/[username]`. This means cache is not properly invalidated.

### 4. Missing Environment Variables
```
OPENAI_API_KEY              — Required for interview simulator
NEXT_PUBLIC_SITE_URL        — Required for auth email redirects
```

### 5. Hardcoded Recent Setups in Interview Simulator
- "Recent Setups" section shows hardcoded data, not real user history from DB.

### 6. `data/jobs.ts` — Potentially Stale
- Contains static job data. May be leftover from before DB integration.

### 7. Dummy / Stitch HTML Folders
- `src/dummy/` — old page mockups
- `src/app/stitch-html/` — HTML design files (reference designs, not live pages)

### 8. `job_applications` FK Note
- `applicant_id` references `auth.users` (not `profiles`), so PostgREST cannot join across this boundary. All profile fetches for applicants require a separate query.

---

## Environment Variables (Current)

```env
NEXT_PUBLIC_SUPABASE_URL=https://hmisspubbdfjrofycmgc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_3n1j_ly36hE5MqeqYwAlWw_9XVWQBI-
# MISSING:
# OPENAI_API_KEY=
# NEXT_PUBLIC_SITE_URL=
```

---

## Pages / Routes Reference

| Route | Status | Notes |
|---|---|---|
| `/` | Working | Marketing landing page |
| `/auth/login` | Working | |
| `/auth/sign-up` | Working | |
| `/auth/forgot-password` | Working | |
| `/auth/update-password` | Working | |
| `/auth/confirm` | Working | Email confirmation callback |
| `/auth/sign-up-success` | Working | |
| `/auth/error` | Working | |
| `/job-seeker/onboarding` | Working | 4-step wizard |
| `/job-seeker/home` | Working | Job feed |
| `/job-seeker/profile/[username]` | Working | Public profile |
| `/job-seeker/profile/[username]/edit` | Working | Edit profile |
| `/job-seeker/job-applications` | Working | Application list |
| `/job-seeker/saved-jobs` | Working | Saved jobs |
| `/job-seeker/assessments` | Working | Assessment taker |
| `/job-seeker/interview-simulator` | Working (API key needed) | AI simulator |
| `/job-seeker/messages` | UI only | No real data |
| `/job-seeker/notifications` | UI only | No real data |
| `/company/onboarding` | Working | |
| `/company/home` | Working | Dashboard |
| `/company/jobs` | Working | |
| `/company/jobs/new` | Working | |
| `/company/jobs/[jobId]` | Working | Edit job |
| `/company/jobs/[jobId]/applicants` | Working | |
| `/company/applicants/[applicationId]` | Working | |
| `/company/assessments` | Working | |
| `/company/assessments/templates` | Missing | To be built |
| `/company/notifications` | Missing | To be built |
| `/company/messages` | Missing | To be built |
| `/company/profile` | Unknown | Needs verification |
| `/admin` | Stub | Coming soon |
| `/admin/reports` | Missing | To be built |
| `/admin/audit-log` | Missing | To be built |
| `/protected` | Test route | |
