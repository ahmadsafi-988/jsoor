# 01 — Current System State

> Last updated: 2026-05-08 | Source: Full codebase analysis + session work (Sprints 1–8 + UI polish pass + job detail sheet + profile redesign + assessments bug fixes)

---

## Summary

The core hiring workflow (job → apply → assess → decide) is complete end-to-end. The admin panel is fully built. Messaging and notifications are live with real DB backends and Supabase Realtime. Assessment templates are fully built (Sprint 6). Job reporting (Report button + server action), job feed pagination, and company profile have all been completed (Sprint 7). Three messaging system bugs were fixed and the chat UI fully rewritten in Sprint 8 (broken PostgREST join, empty name fallback, conversation sort order). A UI polish pass (2026-05-08) fixed dead buttons, missing status values, and a URL bug. A job detail slide-over sheet was added to the job feed — clicking a card body opens a full-detail panel with description, requirements, skills, and an apply form. The job seeker profile page was fully redesigned (2026-05-08) — green gradient banner, circular avatar overlap, icon-row education details, green skill pills, and clean card layout throughout. The only remaining feature is the AI interview simulator (deferred to teammate — UI + API route fully built, needs `OPENAI_API_KEY`).

---

## What Is Implemented

### Authentication
- [x] Job seeker sign-up with email confirmation (redirects to onboarding)
- [x] Company sign-up with email confirmation (redirects to company onboarding)
- [x] Login / logout
- [x] Forgot password / update password flow
- [x] Role-based route guards in `src/middleware.ts`
- [x] Admin redirect guard (admin users → `/admin`)
- [x] Blocked user guard (middleware signs out + redirects to login with `?error=account_blocked`)
- [x] Suspended user guard (middleware → `/auth/suspended` with reason shown + sign-out button)

### Job Seeker Onboarding (`/job-seeker/onboarding`)
- [x] 4-step wizard: Identity → Education → Skills → Done
- [x] Avatar upload to Supabase storage (`avatars` bucket)
- [x] CV upload to Supabase storage (`cvs` bucket)
- [x] University autocomplete search from `universities` table
- [x] Single-write architecture (all DB writes committed on final step)
- [x] Username uniqueness check with debounce

### Job Seeker Profile (`/job-seeker/profile/[username]`)
- [x] Public profile page (accessible without login)
- [x] **Redesigned header** — green gradient banner, circular avatar overlapping the banner, name / degree / location below; "Edit Profile" button top-right (own profile only)
- [x] About section — hidden from visitors when empty; Plus shortcut (owner only) links to edit page
- [x] Projects section — card tiles with status badge and GitHub link (no timeline)
- [x] Skills section — green-tinted pill tags; "Add" link (owner only); hidden from visitors when empty
- [x] Education details card — icon-row layout (`GraduationCap`, `BookOpen`, `Star`, `Calendar`, `Globe`); CV download as ghost button; hidden when no fields are set
- [x] Badges/certifications section — hover fade-in ExternalLink icon
- [x] CV download via Supabase signed URL
- [x] Website link — safe URL handling (`startsWith("http")` guard prevents double `https://`)
- [x] Edit profile (`/job-seeker/profile/[username]/edit`) — cache properly invalidated after edits

### Job Feed (`/job-seeker/home`)
- [x] Active jobs listing (sorted by skill match ratio)
- [x] Filters admin-locked jobs out of results
- [x] Skill matching: matchCount / matchTotal displayed per job
- [x] Match badges: "Strong Match" (≥70%), "Partial Match" (≥40%)
- [x] Filter tabs: All, Best Match, Full-time, Remote, Hybrid, Internship
  - **Best Match** filter: shows only jobs where user has ≥50% of required skills (`matchCount / matchTotal >= 0.5`); jobs with no required skills are excluded
- [x] Search by role or company name
- [x] Apply to job with optional cover letter (inline form on card, or via detail sheet)
- [x] Save/unsave jobs (persisted to DB)
- [x] "Show More" button — client-side pagination, 9 jobs per page; resets on filter/search change
- [x] Report button (Flag icon) on every job card — inline form with reason textarea; `reportJob` server action inserts into `job_reports` with `status: 'pending'`
- [x] **Job detail slide-over sheet** — clicking the card body (title / description / skills) opens a 560px right-side panel:
  - Header: company logo, title, match badge, meta pills (location, type, salary, posted date)
  - Full description and requirements (not truncated)
  - All required skills with match counter ("X of Y matched")
  - Sticky footer with Apply Now → inline cover letter form; submitting closes sheet and marks card Applied; already-applied state shown with green confirmation
  - One shared Sheet instance — switching jobs swaps content without re-mounting

### Job Applications (`/job-seeker/job-applications`)
- [x] List of applied jobs with status badge and date
- [x] Filter tabs by status
- [x] Application status: applied, under_review, assessment_sent, assessment_completed, shortlisted, accepted, rejected
- [x] "Take Assessment" action button for `assessment_sent` applications
- [x] "View Submission" action button for `assessment_completed` applications

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
- [x] Two-panel layout: conversation list (left) + chat thread (right)
- [x] Conversations fetched from DB on load — `getJobSeekerConversations` fetches companies in a separate parallel query (broken PostgREST FK join fixed in Sprint 8)
- [x] Conversations sorted by most recent activity (`last_message_at` DESC)
- [x] Messages loaded per conversation from DB (`messages` table)
- [x] **Supabase Realtime** — new messages appear instantly via `postgres_changes` INSERT subscription
- [x] Send message: auto-resizing textarea; Enter to send, Shift+Enter for newline
- [x] File attachments: upload to `message-attachments` private storage bucket client-side; signed URL generated for download
- [x] `markConversationRead` called on conversation switch — unread badge cleared
- [x] Unread message count badge on Messages nav item in sidebar — clears immediately when user navigates to messages page
- [x] Conversation search/filter
- [x] Empty state for no conversations
- [x] Date separators between messages from different days
- [x] Timestamps shown only at end of consecutive same-sender message blocks
- [x] Error state with "Try again" link if message load fails
- [x] Conversation list shows company name (not job title) as primary label; job title as subtitle

### Notifications (`/job-seeker/notifications`)
- [x] Notifications fetched from DB on page load (`notifications` table)
- [x] Grouped by Today / Yesterday / Earlier
- [x] Unread notifications styled with green left border
- [x] Each notification links to its relevant page on click
- [x] "Mark all as read" button — updates DB + refreshes page
- [x] Empty state
- [x] Unread notification count badge on Bell nav item in sidebar — clears immediately when user navigates to notifications page
- [x] Triggered automatically by 5 server actions:
  - `applyToJob` → notifies company (`new_application`)
  - `updateApplicationStatus` → notifies job seeker (`application_status_changed`)
  - `sendAssessment` → notifies job seeker (`assessment_sent`)
  - `submitAssessment` → notifies company (`assessment_submitted`)
  - `releaseAssessmentResults` → notifies job seeker (`assessment_results_released`)

---

### Job Seeker Sidebar (`AppSidebar`)
- Nav items: Home, Profile, Applications, Saved Jobs, Assessments, Interview Simulator, Messages, Notifications
- Bottom: Logout only — **Settings link removed** (no `/job-seeker/settings` page exists)
- Unread badges on Messages and Notifications items

---

### Company Onboarding (`/company/onboarding`)
- [x] Company name, username, industry, location, description
- [x] Creates row in `companies` + `profiles` tables

### Company Sidebar (`CompanySidebar`)
- Nav items: Dashboard, Jobs, Assessments, Messages, Profile, Notifications
- Bottom: Logout only — **Settings link removed** (no `/company/settings` page exists; profile editing is under `/company/profile`)
- Unread badges on Messages and Notifications items
- Company logo + name shown at the bottom of the sidebar

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
- [x] Applicants per job (`/company/jobs/[jobId]/applicants`) — all 7 statuses covered including `accepted`
- [x] Applicant detail (`/company/applicants/[applicationId]`):
  - Full applicant profile (bio, education, skills, projects, badges)
  - CV download (signed URL)
  - Application status management (state machine)
  - Send assessment form (multi-question builder: MCQ, True/False, Open)
  - **Template picker modal** — "Load Template" button opens a centered modal with template cards (name, description, question count, time limit, tags); "Use" loads the template; X button clears the selection
  - Review submitted assessment (score override, feedback)
  - Release assessment results to applicant
  - **"Message" button** — creates or opens conversation, redirects to `/company/messages?conv=...`
  - **Polished UI** — `max-w-5xl` layout, shadowed cards, uppercase section headers with border-b dividers, larger round avatar with ring, name+status in a dedicated header card

### Company Assessments (`/company/assessments`)
- [x] List all assessments across all applications with live stat cards (pending / submitted / reviewed counts)
- [x] **Data fix** — `getCompanyAssessments` previously failed silently: PostgREST rejected the nested `profiles!job_applications_applicant_id_fkey` join (FK → `auth.users`, not `profiles`). Fixed with a two-step query: fetch assessments + job titles, then fetch profiles separately by applicant ID and merge in JS.
- [x] **Clickable rows** — entire card is now a `<Link>` to the applicant detail page; removed the separate "View →" Action column; columns rebalanced (Assessment 4, Applicant 3, Job 3, Status 2)
- [x] Applicant name fallback: empty `first_name`/`last_name` renders as `"Applicant"` instead of blank
- [x] Applicant detail page name fallback: same `|| "Applicant"` guard in `ApplicantDetailClient`

### Company Messages (`/company/messages`)
- [x] Same two-panel layout as job seeker messages
- [x] Conversations show applicant name + job title (company perspective)
- [x] Supabase Realtime, send message, file attachments — all identical to job seeker
- [x] Unread message count badge on Messages nav item in company sidebar

### Company Notifications (`/company/notifications`)
- [x] Same design as job seeker notifications
- [x] Receives `new_application` and `assessment_submitted` notifications
- [x] "Mark all as read", deep links, unread badge on Bell nav item

### Company Profile (`/company/profile`)
- [x] Full form for editing company name, username, description, industry, size, location, founded year, website
- [x] Data loaded client-side from `companies` + `profiles` tables; `upsertCompany` server action writes both
- [x] **Company logo upload** — separate card above the form; uploads to `avatars/company-logos/{userId}.{ext}` (upsert); saves public URL directly to `companies.logo_url`; preview updates immediately without saving the form

### Email Notifications (Supabase Edge Function)
- [x] Edge function `email-notification` exists in `supabase/functions/`
- [x] Sends emails on status changes: reviewed, shortlisted, accepted, rejected
- [ ] **UNKNOWN**: Whether the trigger is wired in Supabase dashboard

---

### Admin Panel (`/admin`)
- [x] Auth guard (only `role = admin` can access)
- [x] Sidebar with nav: Dashboard, Jobs, Companies, Users, Reports, Audit Log
- [x] **Dashboard** (fully rebuilt — `getAdminStats` extended):
  - **Stat cards** — Total Users (blocked/suspended sub-line, links to users page), Total Companies (verified/unverified sub-line, links to companies page), Total Jobs (active/locked sub-line, links to jobs page), Total Applications
  - **Needs Attention strip** — conditional alerts for: pending reports (red), unverified companies (amber), blocked users (grey); each links to the relevant management page; hidden when nothing needs action
  - **Application Pipeline chart** — horizontal CSS bar chart for all 6 application statuses (applied, under review, shortlisted, assessment sent, assessment done, rejected); bars scaled to the highest count; uses service role client to bypass `job_applications` RLS (policy restricts reads to applicant/company — admin would get 0 rows otherwise)
  - **Jobs Health card** — stacked bar + legend: active (green) / inactive (grey) / locked (red)
  - **Company Verification card** — stacked bar + legend: verified (blue) / unverified (amber)
  - **Recent Admin Activity** — last 6 audit log entries (action badge, target, admin name, time-ago); "View all" links to audit log
  - Removed: redundant quick-nav links that duplicated the sidebar

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
- [x] Job seeker "Report" button on job cards — Flag icon opens inline form; `reportJob` action in `lib/company/actions.ts`
- **Bug fixes (2026-05-05):**
  - `reportJob` was inserting `reporter_id` → corrected to `reported_by` (actual column name)
  - `getAllReports` PostgREST FK hint was `!job_reports_reporter_id_fkey` → corrected to `!job_reports_reported_by_fkey`
  - Reporter name now resolves as: full name → username → "Unknown" (handles users with empty first/last name)

### Admin — Audit Log (`/admin/audit-log`)
- [x] Chronological list of last 200 admin actions
- [x] Columns: timestamp, admin name, action (color-coded badge), target, reason

---

## What Is Missing / Incomplete

| Feature | Status | Notes |
|---|---|---|
| Assessment templates | ✅ Done | List, create, edit, delete pages; "Load Template" picker in send-assessment form; `use_count` tracked |
| Job seeker "Report" button | ✅ Done | Flag icon on every job card; inline form + `reportJob` action; duplicate prevented by DB constraint |
| Job pagination ("Show More") | ✅ Done | Client-side pagination, 9 per page, resets on filter/search change |
| Company profile edit | ✅ Done | Full form — name, username, description, industry, size, location, founded year, website |
| OpenAI API key | Missing | `OPENAI_API_KEY` not in `.env.local` — interview simulator blocked |
| Supabase types — CLI regen | Deferred | Types updated manually; run CLI when login available |
| "Message" button on job seeker applications | Not built | Company initiates via applicant detail; job seeker sees conversations from messages page |

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

- **MCP server:** configured at project scope — Supabase MCP tools are available in every session. Use them to run SQL migrations, inspect tables, and query live data.
- **Service role key:** saved in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` — used by server actions for inserts that cross RLS boundaries (e.g. notification inserts from company → job seeker); also used in `getAdminStats` for `job_applications` reads (RLS restricts to applicant/company — admin role gets 0 rows without service role)
- **Project ref:** `hmisspubbdfjrofycmgc`

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
| `/auth/suspended` | Working | Shown to suspended users with reason + sign-out button |
| `/auth/error` | Working | |
| `/job-seeker/onboarding` | Working | 4-step wizard |
| `/job-seeker/home` | Working | Job feed (filters admin-locked) |
| `/job-seeker/profile/[username]` | Working | Public profile |
| `/job-seeker/profile/[username]/edit` | Working | Edit profile (cache fixed) |
| `/job-seeker/job-applications` | Working | Application list with status tabs |
| `/job-seeker/saved-jobs` | Working | Saved jobs |
| `/job-seeker/assessments` | Working | Assessment taker + results |
| `/job-seeker/interview-simulator` | Working (API key needed) | AI simulator |
| `/job-seeker/messages` | **Working** | Real DB + Realtime |
| `/job-seeker/notifications` | **Working** | Real DB, grouped, deep links |
| `/company/onboarding` | Working | |
| `/company/home` | Working | Dashboard |
| `/company/jobs` | Working | |
| `/company/jobs/new` | Working | |
| `/company/jobs/[jobId]` | Working | Shows locked banner if admin-locked |
| `/company/jobs/[jobId]/applicants` | Working | |
| `/company/applicants/[applicationId]` | Working | Message button, template picker modal, polished layout |
| `/company/assessments` | Working | |
| `/company/assessments/templates` | Working | List all templates |
| `/company/assessments/templates/new` | Working | Create template with question builder |
| `/company/assessments/templates/[templateId]` | Working | Edit or delete a template |
| `/company/messages` | **Working** | Real DB + Realtime |
| `/company/notifications` | **Working** | Real DB, grouped, deep links |
| `/company/profile` | Working | Full edit form + company logo upload |
| `/admin` | Working | Rich dashboard: stat cards, attention alerts, pipeline chart, health bars, activity feed |
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

- `OPENAI_API_KEY` missing — interview simulator deferred to teammate; UI + API route are fully built
- Supabase types file is manually maintained — regenerate with CLI when access token is available
- "Recent Setups" in interview simulator — still hardcoded, not wired to DB history
