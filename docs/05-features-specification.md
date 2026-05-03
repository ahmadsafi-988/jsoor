# 05 — Features Specification

> Last updated: 2026-05-03 | Status: Living document — updated as features are spec'd and built

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
**Status:** 🔲 (UI shell only — job seeker page exists, company page does not)

**Confirmed design (Round 2C — 2026-05-03):**

**Access rule:** A conversation can only exist between a company and a job seeker who have an active application together. Validated server-side before any message is sent.

**Shape:** 1-on-1 direct messages only. One conversation per application.

**Updates:** Supabase Realtime — messages appear instantly without refresh.

**Content:** Text + file attachments (stored in private `message-attachments` storage bucket; signed URLs at read time).

**Pages:**
- `/job-seeker/messages` — existing shell, replace hardcoded data
- `/company/messages` — new page, same layout (conversation list + thread)

**Conversation lifecycle:**
- No conversation row created at application time — lazy creation on first message send
- Server action validates application exists before creating conversation or inserting message

**Per message:**
- Sender, text content (nullable if attachment-only), optional attachment (URL + filename), timestamp, `is_read`

**Unread count badge** on sidebar nav for both roles.

---

### F-16: In-App Notifications
**Status:** 🔲 (UI shell only — job seeker page exists, company page does not)

**Confirmed design (Round 2B — 2026-05-03):**

**Shared `notifications` table** — one table, filtered by `user_id`. No Realtime; data loads fresh on page visit.

**Job seeker receives notifications for:**
- Application status changed (under_review, shortlisted, rejected, assessment_sent, assessment_completed)
- Assessment sent by company
- Assessment results released by company

**Company receives notifications for:**
- New application received on one of their jobs
- Applicant submitted an assessment

**Pages:**
- `/job-seeker/notifications` — existing shell, replace hardcoded data with real DB reads
- `/company/notifications` — new page, same design pattern

**Per notification:**
- Title + body text
- Deep link (URL) — destination depends on notification type, to be defined per-type during implementation (see TASK-13)
- `is_read` flag — "Mark all read" sets all to true
- Grouped by date (Today / Yesterday / Earlier)

**Trigger mechanism:** Application-level inserts — each Server Action that causes a notification event inserts a row into `notifications` after the main operation.

**Unread count badge** on sidebar nav for both roles.

---

### F-17: Admin Panel
**Status:** 🔲 (stub only — auth guard works, content TBD)

`/admin` (current): auth guard in place, renders "Admin panel coming soon"

**Confirmed scope (Round 2A — 2026-05-03):**

#### Dashboard Homepage
- Stats: total users, total companies, total jobs, total applications

#### Job Management
- View all jobs across all companies
- **Lock a job** (`admin_locked = true`): hides the job from job seekers even if company has it active. Company cannot reactivate it until admin removes the lock.
- Unlock a job (remove the lock)
- Jobs go live immediately on company post — no admin approval needed

#### Company Management
- View all companies
- **Verify a company** (`is_verified = true`): shows a verified badge next to the company name
- Unverify a company

#### User Management
- View all users (job seekers + companies)
- **Block a user** (`is_blocked = true`): removes the user from the system
- **Suspend a user** (`is_suspended = true`): notifies the user via the messaging system; account temporarily restricted. More details TBD.
- Suspension reason stored in `profiles.suspension_reason`

#### Job Reports (Proof Feature — confirmed 2026-05-03)
- Job seekers can report any job from the job feed (Report button on job card)
- Report form: select or type a reason, submit
- Inserts into `job_reports` with `status = 'pending'`
- **Admin view:** `/admin/reports` — list of all reported jobs, grouped by status (pending / reviewed / dismissed)
- Admin can mark a report as reviewed or dismissed
- Admin can lock the job directly from the report view

#### Admin Audit Log (Proof Feature — confirmed 2026-05-03)
- Every admin action is automatically recorded in `admin_audit_logs`
- Recorded: `action`, `target_type`, `target_id`, `target_label`, `reason`, `admin_id`, `created_at`
- **Admin view:** `/admin/audit-log` — full chronological log of all admin actions
- Filterable by action type and admin (supports multi-admin setups — see who did what)
- Written automatically inside every admin server action (lock job, verify company, block user, etc.)

**DB tables confirmed present:** `admin_audit_logs`, `job_reports` — both exist in live DB, no code written yet.

**DB columns confirmed present:** `jobs.admin_locked`, `companies.is_verified`, `profiles.is_blocked`, `profiles.is_suspended`, `profiles.suspension_reason` — all present in live DB but not yet in generated types or any code.

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
  depends on → OPENAI_API_KEY environment variable

F-16 Notifications
  depends on → DB table + triggers (not yet built)

F-17 Admin Panel
  depends on → all other features (moderates them)
```
