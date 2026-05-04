# 01 — Current System State

> Last updated: 2026-05-04 | Source: Full codebase analysis + session work

---

## Summary

The core hiring workflow (job → apply → assess → decide) is complete end-to-end. The admin panel is fully built. Structural debt has been cleaned. Two secondary features remain UI-only shells: messages and notifications. Those are next.

---

## What Is Implemented

### Authentication
- [x] Job seeker sign-up with email confirmation (redirects to onboarding)
- [x] Company sign-up with email confirmation (redirects to company onboarding)
- [x] Login / logout
- [x] Forgot password / update password flow
- [x] Role-based route guards in `src/middleware.ts`
- [x] Admin redirect guard (admin users → `/admin`)
- [x] Blocked user guard (middleware signs out + redirects to login)
- [x] Suspended user guard (middleware → `/auth/suspended` with reason shown)

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
- [x] Edit profile (`/job-seeker/profile/[username]/edit`) — cache properly invalidated after edits

### Job Feed (`/job-seeker/home`)
- [x] Active jobs listing (sorted by skill match ratio)
- [x] Filters admin-locked jobs out of results
- [x] Skill matching: matchCount / matchTotal displayed per job
- [x] Match badges: "Strong Match" (≥70%), "Partial Match" (≥40%)
- [x] Filter tabs: All, Best Match, Full-time, Remote, Hybrid, Internship
- [x] Search by role or company name
- [x] Apply to job with optional cover letter (inline form)
- [x] Save/unsave jobs (persisted to DB)
- [ ] "Show More" button renders but has no pagination logic

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
- [ ] **BLOCKED**: `OPENAI_API_KEY` not set in `.env.local`

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
- [x] Admin-locked banner shown on edit page; is_active checkbox disabled when locked
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

---

### Admin Panel (`/admin`)
- [x] Auth guard (only `role = admin` can access)
- [x] Sidebar with nav: Dashboard, Jobs, Companies, Users, Reports, Audit Log
- [x] Dashboard: live stat cards (total users, companies, jobs, applications) + quick-nav

### Admin — Job Management (`/admin/jobs`)
- [x] Table of all jobs across all companies
- [x] Lock a job (`admin_locked = true`): hidden from job feed even if company has it active; reason logged
- [x] Unlock a job: company can reactivate; logged
- [x] Every action auto-written to `admin_audit_logs`

### Admin — Company Management (`/admin/companies`)
- [x] Table of all companies with verification status
- [x] Verify a company (`is_verified = true`); logged
- [x] Unverify a company; logged

### Admin — User Management (`/admin/users`)
- [x] Table of all users (job seekers + companies) with block/suspend status
- [x] Block a user (`is_blocked = true`): middleware signs them out on next request; logged
- [x] Unblock a user; logged
- [x] Suspend a user (`is_suspended = true` + reason): middleware redirects to `/auth/suspended`; logged
- [x] Unsuspend a user; logged

### Admin — Job Reports (`/admin/reports`)
- [x] All reports grouped by status: pending / reviewed / dismissed
- [x] Mark report reviewed; logged
- [x] Dismiss report; logged
- [x] Lock job directly from report view; logged
- [ ] Job seeker "Report" button on job cards not yet built

### Admin — Audit Log (`/admin/audit-log`)
- [x] Chronological list of last 200 admin actions
- [x] Columns: timestamp, admin name, action (color-coded badge), target, reason

---

## What Is Missing / Incomplete

| Feature | Status | Notes |
|---|---|---|
| Real-time messaging | Missing | Tables not created yet; job seeker UI shell exists; no company page |
| In-app notifications | Missing | Table not created yet; job seeker UI shell exists; no company page |
| Job seeker "Report" button | Missing | Admin reports page is ready to receive them |
| Assessment templates | Missing | DB table exists; no UI or actions |
| Job pagination | Partial | "Show More" button does nothing |
| Company profile edit | Unknown | Page exists, not verified |
| Company notifications page | Missing | `/company/notifications` not built |
| Company messages page | Missing | `/company/messages` not built |
| OpenAI API key | Missing | `OPENAI_API_KEY` not in `.env.local` |
| Supabase types — CLI regen | Deferred | Types updated manually; run CLI when login available |

---

## Environment Variables (Current)

```env
NEXT_PUBLIC_SUPABASE_URL=https://hmisspubbdfjrofycmgc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_3n1j_ly36hE5MqeqYwAlWw_9XVWQBI-
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=<set — see .env.local>
# MISSING:
# OPENAI_API_KEY=
```

## Supabase Access (Tools)

- **MCP server:** configured at project scope via `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=hmisspubbdfjrofycmgc"` — authenticated as of 2026-05-04
- **Service role key:** saved in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` — used by server actions for inserts that cross RLS boundaries (e.g. notification inserts from company → job seeker)
- **Project ref:** `hmisspubbdfjrofycmgc`
- In new Claude Code sessions the MCP tools are available immediately — use them to run SQL migrations, inspect tables, and query live data directly

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
| `/auth/suspended` | Working | Shown to suspended users |
| `/auth/error` | Working | |
| `/job-seeker/onboarding` | Working | 4-step wizard |
| `/job-seeker/home` | Working | Job feed (filters admin-locked) |
| `/job-seeker/profile/[username]` | Working | Public profile |
| `/job-seeker/profile/[username]/edit` | Working | Edit profile (cache fixed) |
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
| `/company/jobs/[jobId]` | Working | Shows locked banner if admin-locked |
| `/company/jobs/[jobId]/applicants` | Working | |
| `/company/applicants/[applicationId]` | Working | |
| `/company/assessments` | Working | |
| `/company/assessments/templates` | Missing | To be built |
| `/company/notifications` | Missing | To be built |
| `/company/messages` | Missing | To be built |
| `/company/profile` | Unknown | Needs verification |
| `/admin` | Working | Dashboard with live stats |
| `/admin/jobs` | Working | Lock/unlock jobs |
| `/admin/companies` | Working | Verify/unverify companies |
| `/admin/users` | Working | Block/suspend users |
| `/admin/reports` | Working | Review/dismiss/lock from reports |
| `/admin/audit-log` | Working | Full admin action history |

---

## Structural Issues (Resolved)

All structural debt from the previous state has been cleaned:
- ✅ Duplicate routes removed (`marketing/`, `Company/`, `Administrator/`, disabled layout)
- ✅ Dead code removed (`src/dummy/`, `src/app/stitch-html/`, `data/jobs.ts`, orphaned components)
- ✅ `revalidatePath` fixed across all profile edit actions
- ✅ `NEXT_PUBLIC_SITE_URL` added to `.env.local`

## Remaining Known Issues

- `ALLOWED_TRANSITIONS` in `lib/company/actions.ts` — live DB status values not verified (needs service key)
- `OPENAI_API_KEY` missing — interview simulator blocked at runtime
- Supabase types file is manually maintained — regenerate with CLI when access token is available
- "Recent Setups" in interview simulator — still hardcoded, not wired to DB history
