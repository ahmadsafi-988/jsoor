# 05 — Features Specification

> Last updated: 2026-05-04 | Status: Living document — updated as features are spec'd and built

---

## Feature Status Legend

| Symbol | Meaning |
|---|---|
| ✅ | Implemented and working |
| ⚠️ | Partially implemented / has known issues |
| 🔲 | Planned, not yet built |
| ❌ | Blocked or broken |

---

## CORE FEATURES (MVP)

### F-01: Authentication
**Status:** ✅

- [x] Job seeker sign-up with email confirmation
- [x] Company sign-up with email confirmation
- [x] Login / logout
- [x] Forgot password / update password
- [x] Role-based route protection (middleware)
- [x] Admin role guard

---

### F-02: Job Seeker Onboarding
**Status:** ✅

4-step wizard at `/job-seeker/onboarding`:
- Step 1 — Identity: name, username (with uniqueness check), bio, location, website, GitHub, avatar upload, CV upload
- Step 2 — Education: university (search from DB), degree, GPA, years
- Step 3 — Skills: pick from master `skills` table, added to `profile_to_skills`
- Step 4 — Done: CTA to complete profile

Single DB commit architecture: all writes happen on "Finish setup", not incrementally.

---

### F-03: Job Seeker Profile
**Status:** ✅

Public profile at `/job-seeker/profile/[username]` (accessible without login):
- Header: avatar, name, degree, location, edit button (own profile only)
- About: bio
- Projects: timeline view with status badges and GitHub links
- Right sidebar: education details, CV download (signed URL), skills, certifications/badges

Edit profile at `/job-seeker/profile/[username]/edit`:
- All fields from onboarding
- Add/edit/delete projects
- Add/edit/delete badges
- Add/remove skills

---

### F-04: Job Feed
**Status:** ⚠️ (pagination not implemented)

Job seeker home at `/job-seeker/home`:
- Hero search bar (search by role or company name)
- Filter tabs: All, Best Match, Full-time, Remote, Hybrid, Internship
- Jobs sorted by skill match ratio (highest match first)
- Per-card: company logo, job title, match badge, location, type tag, description excerpt, required skills, salary
- Apply inline (with optional cover letter textarea)
- Save/unsave button per card
- "Show More" button (UI only — no pagination backend)

---

### F-05: Apply to Job
**Status:** ✅

- Inline apply form per job card
- Optional cover letter
- Duplicate apply prevention (DB unique constraint + error handling)
- Optimistic UI: card shows "Applied" immediately

---

### F-06: Saved Jobs
**Status:** ✅

- Save button on every job card (persisted to `saved_jobs`)
- Saved jobs page at `/job-seeker/saved-jobs`
- Unsave from list

---

### F-07: Job Applications
**Status:** ✅

- `/job-seeker/job-applications`: list of all applications with status, company, role
- Status display: applied, under review, shortlisted, rejected, assessment sent, assessment completed

---

### F-08: Company Onboarding
**Status:** ✅

`/company/onboarding`:
- Company name, username, industry, location, description
- Creates `companies` + `profiles` rows

---

### F-09: Company Job Management
**Status:** ✅

- `/company/jobs`: list all company jobs
- `/company/jobs/new`: create job with title, description, location, type, salary, requirements, skill picker
- `/company/jobs/[jobId]`: edit job, toggle active/inactive, delete
- Skills attached via `job_to_skills`

---

### F-10: Applicant Management
**Status:** ✅

- `/company/jobs/[jobId]/applicants`: list applicants with basic info, status filter
- `/company/applicants/[applicationId]`: full applicant view
  - Complete profile: bio, education, skills, projects, badges, CV download
  - Status management with state machine transitions
  - Assessment send form
  - Assessment review (score override, feedback)
  - Release results toggle

---

### F-11: Assessments (Company-Created)
**Status:** ✅

**Company side:**
- Send assessment: title, description, deadline, time limit, questions (MCQ/True-False/Open)
- View submitted assessments
- Override score and add feedback
- Release results to applicant

**Job seeker side (`/job-seeker/assessments`):**
- Instructions screen (question count, time limit, deadline)
- One-way question navigation (no back)
- Countdown timer (auto-submit on expire)
- MCQ: A/B/C/D selection
- True/False: binary buttons
- Open: textarea
- Auto-score on submit for MCQ + T/F
- Results view (after company releases): score, per-question correctness breakdown, feedback

---

### F-12: AI Interview Simulator
**Status:** ❌ (OPENAI_API_KEY not configured)

`/job-seeker/interview-simulator`:
- Setup form: target role, skills/technologies, interview type (Technical/System Design/Behavioral/Mixed), difficulty level
- Backend: POST `/api/ai` → OpenAI GPT-4o-mini
- Generate 5 interview questions
- Q&A loop with progress indicator
- Submit all answers → AI evaluates
- Results: per-question score (1-10), strengths, improvements, overall summary

**Blocker:** `OPENAI_API_KEY` not present in `.env.local`. Feature will throw 500 at runtime.

---

### F-13: Email Notifications
**Status:** ⚠️ (edge function exists; DB trigger status unknown)

Supabase Edge Function `email-notification`:
- Triggered when `job_applications.status` changes
- Emails sent for: `reviewed`, `shortlisted`, `accepted`, `rejected`
- Template includes: headline, body copy, application details

**Unknown:** Whether the Supabase webhook/trigger is active in the dashboard.

---

### F-14: Company Dashboard
**Status:** ✅

- Stats: total jobs, active jobs, total applications, pending assessments
- Recent jobs (last 5) with status badges
- Recent assessments (last 3)
- Quick actions: Post a Job, View Assessments

---

## SECONDARY FEATURES

### F-15: Messages
**Status:** ✅

**Implementation summary:**

**Access rule:** A conversation can only exist between a company and a job seeker who share an application. `getOrCreateConversation` validates this server-side before creating any row.

**Shape:** 1-on-1 direct messages. One conversation per application (`conversations.application_id` UNIQUE FK).

**Updates:** Supabase Realtime — `postgres_changes` INSERT subscription filtered by `conversation_id`. Messages appear instantly for both parties.

**Content:** Text + file attachments. Attachments uploaded client-side to private `message-attachments` bucket; signed URLs generated on demand for downloads.

**Pages:**
- `/job-seeker/messages` — server fetches `getJobSeekerConversations()`, passes to `MessagesClient`
- `/company/messages` — server fetches `getCompanyConversations()`, passes to `MessagesClient`

Both pages use thin re-exports of the shared `components/app/MessagesClient.tsx` component.

**Conversation entry point:** "Message" button on company applicant detail page — calls `getOrCreateConversation(applicationId)`, redirects to `/company/messages?conv=<id>`.

**Unread count badge** on Messages nav item in both `AppSidebar` and `CompanySidebar`.

**Key files:**
- `lib/messages/actions.ts` — `getOrCreateConversation`, `getJobSeekerConversations`, `getCompanyConversations`, `getMessages`, `sendMessage`, `markConversationRead`, `getUnreadMessageCount`
- `components/app/MessagesClient.tsx` — shared two-panel chat UI with Realtime + attachments

---

### F-16: In-App Notifications
**Status:** ✅

**Implementation summary:**

**Shared `notifications` table** — one table, filtered by `user_id`. No Realtime; data loads fresh on page visit.

**Job seeker receives notifications for:**
- `application_status_changed` — when company changes application status
- `assessment_sent` — when company sends an assessment
- `assessment_results_released` — when company releases results

**Company receives notifications for:**
- `new_application` — when a job seeker applies to one of their jobs
- `assessment_submitted` — when an applicant submits an assessment

**Pages:**
- `/job-seeker/notifications` — DB-backed, grouped by Today/Yesterday/Earlier, deep links, mark-all-read
- `/company/notifications` — same design

**Per notification:**
- `title`, `body`, `link` (deep link URL), `is_read`, `type`, `created_at`
- "Mark all as read" sets `is_read = true` for all unread rows
- Grouped by date (Today / Yesterday / Earlier)
- Unread items styled with green left border

**Trigger mechanism:** `insertNotification()` called inside 5 server actions in `lib/company/actions.ts`: `applyToJob`, `updateApplicationStatus`, `sendAssessment`, `submitAssessment`, `releaseAssessmentResults`. Uses service role client to bypass RLS for cross-user writes.

**Unread count badge** on Bell nav item in both `AppSidebar` and `CompanySidebar`.

**Key files:**
- `lib/notifications/actions.ts` — `insertNotification` (service role), `getNotifications`, `markAllNotificationsRead`

---

### F-17: Admin Panel
**Status:** ✅

#### Dashboard Homepage (`/admin`)
- Live stat cards: total users, companies, jobs, applications
- Quick-nav to all admin sections

#### Job Management (`/admin/jobs`)
- Table of all jobs across all companies
- Lock a job (`admin_locked = true`): job hidden from job feed even if company has it active; company cannot reactivate until admin unlocks
- Unlock a job
- Every action logged to `admin_audit_logs`

#### Company Management (`/admin/companies`)
- Table of all companies with verification status
- Verify a company (`is_verified = true`) — logged
- Unverify a company — logged

#### User Management (`/admin/users`)
- Table of all users (job seekers + companies) with block/suspend status
- Block a user (`is_blocked = true`): middleware forces sign-out on next request — logged
- Unblock — logged
- Suspend a user (`is_suspended = true` + reason): middleware redirects to `/auth/suspended` with reason shown — logged
- Unsuspend — logged

#### Job Reports (`/admin/reports`)
- All reports grouped by status: pending / reviewed / dismissed
- Mark report reviewed — logged
- Dismiss report — logged
- Lock job directly from report view — logged
- ⚠️ Job seeker "Report" button on job cards not yet built (report page is ready to receive them)

#### Admin Audit Log (`/admin/audit-log`)
- Chronological list of last 200 admin actions
- Columns: timestamp, admin name, action (color-coded badge), target, reason

**Key files:**
- `lib/admin/actions.ts` — all admin server actions (lock/unlock, verify, block/suspend, report review)
- `lib/admin/data.ts` — admin read queries (all jobs, companies, users, reports, audit log, stats)
- `components/app/AdminSidebar.tsx` — admin navigation sidebar

---

### F-18: Skill Matching Score
**Status:** ✅ (rule-based)

Current implementation:
- `matchCount` = number of job-required skills the user has
- `matchTotal` = total job-required skills
- `matchRatio` = matchCount / matchTotal
- Used for "Strong Match" (≥70%) and "Partial Match" (≥40%) badges
- Jobs sorted by ratio descending

**Future:** Could incorporate assessment scores, project relevance, etc.

---

### F-19: Platform-Level Assessments
**Status:** 🔲 (not planned yet)

Per product overview: platform-created skill tests (not company-specific) that any job seeker can take to build a verified skill profile.

**Needs:** New table `platform_assessments`, new UI for taking + displaying results on profile.

---

### F-20: Job Reporting (Job Seeker)
**Status:** 🔲 (table exists in DB — `job_reports` — no UI or code)

- "Report" button on every job card in the feed
- Report modal: reason input (free text or predefined options)
- Submit → inserts row into `job_reports` with `status = 'pending'`
- Seeker cannot report the same job twice (unique constraint or error handling)

---

### F-21: Assessment Templates (Company)
**Status:** 🔲 (table exists in DB — `assessment_templates` — no UI or code)

**Confirmed design (2026-05-03):**

Companies can build reusable assessment templates so they don't have to create assessments from scratch every time. A template is a saved blueprint (title, description, questions, time limit, tags) that the company can load when sending an assessment to an applicant, edit if needed, then send.

**Template management pages:**
- `/company/assessments/templates` — list all saved templates with name, tags, use count, last updated
- `/company/assessments/templates/new` — create a new template using the same question builder as assessments (MCQ / True-False / Open)
- `/company/assessments/templates/[templateId]` — edit or delete an existing template

**Integration with send-assessment flow:**
- When a company opens the "Send Assessment" form on an applicant's page, they get two options: **Start from scratch** (existing) or **Load from template**
- Loading a template prefills the form — company can still edit everything before sending
- On send: `use_count` on the template increments by 1

**Per template:**
- `title`, `description`, `questions` (same shape as `assessments.questions`), `time_limit`, `tags` (text array for filtering), `use_count` (auto-tracked)

---

## Feature Dependencies

```
F-04 Job Feed
  depends on → F-03 Profile (skills needed for match)
  depends on → F-09 Company Jobs (jobs must exist)

F-10 Applicant Management
  depends on → F-09 Company Jobs
  depends on → F-05 Apply to Job

F-11 Assessments
  depends on → F-10 Applicant Management (application must exist)

F-12 Interview Simulator
  depends on → OPENAI_API_KEY environment variable ← STILL BLOCKED

F-15 Messages
  depends on → F-05 Apply to Job (application must exist to gate conversations)

F-16 Notifications
  depends on → F-10, F-11 (triggered by status changes + assessment events)
  depends on → service role key for cross-user inserts

F-17 Admin Panel
  depends on → all other features (moderates them)
  depends on → manual admin row insert (no self-registration)
```
