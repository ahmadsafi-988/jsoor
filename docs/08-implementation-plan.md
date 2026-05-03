# 08 — Implementation Plan

> Last updated: 2026-05-03 | Priority order confirmed by project owner

**Confirmed priority:** E → A → B → C → D (structural cleanup → env fixes → admin panel → notifications → messaging)

**Workflow for every task:**
1. Read/update spec
2. Get approval on approach
3. Implement
4. Verify manually
5. Mark done below

---

## Sprint 1 — Structural Cleanup (Phase 1)

### TASK-01: Remove duplicate and orphaned routes
**Why:** Duplicate `/marketing` route can cause unexpected behavior. Dead `Company/` and `Administrator/` folders are confusing and pollute the codebase.

Steps:
- [ ] Delete `src/app/marketing/` folder entirely
- [ ] Delete `src/app/Company/` folder (capital C)
- [ ] Delete `src/app/Administrator/` folder
- [ ] Delete `src/app/(marketing)/RENAMEDTODISABLElayout.tsx`
- [ ] Confirm landing page still works after deleting `/marketing`
- **Files affected:** `src/app/marketing/`, `src/app/Company/`, `src/app/Administrator/`

### TASK-02: Delete dead code and reference files
Steps:
- [ ] Delete `src/dummy/` folder
- [ ] Delete `src/app/stitch-html/` folder
- [ ] Check if `data/jobs.ts` is imported anywhere — if not, delete
- [ ] Check `components/app-sidebar.tsx` (root) vs `components/app/AppSidebar.tsx` — delete the unused one
- [ ] Check `components/TopBar.tsx` and `components/sidebar.tsx` (root) — delete if unused

---

## Sprint 2 — Bug Fixes (Phase 2)

### TASK-03: Fix missing environment variables
Steps:
- [ ] Add `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to `.env.local`
- [ ] Confirm auth email confirmation redirects work (sign up → click email link → lands at onboarding)
- **Note:** OPENAI_API_KEY to be discussed in upcoming round

### TASK-04: Fix `revalidatePath` in profile actions
Steps:
- [ ] In `lib/profile/actions.ts`, change all occurrences of `revalidatePath("/job-seeker/profile")` to use the username parameter
- [ ] Test: edit profile → save → profile page shows updated data without manual refresh
- **Files:** `lib/profile/actions.ts`

### TASK-05: Verify and align application status values
**Requires:** Supabase service key to inspect live DB
Steps:
- [ ] Query live `job_applications` for actual distinct status values
- [ ] Compare with `ALLOWED_TRANSITIONS` in `lib/company/actions.ts`
- [ ] Align code if they differ
- **Files:** `lib/company/actions.ts`

---

## Sprint 3 — Admin Panel (Phase 3)

**First critical prerequisite:** Regenerate `lib/supabase_generated_types.ts` — 5 columns exist in DB but not in types: `profiles.is_blocked`, `profiles.is_suspended`, `profiles.suspension_reason`, `jobs.admin_locked`, `companies.is_verified`.

### TASK-06: Regenerate Supabase types
- [ ] Run `npx supabase gen types typescript --project-id hmisspubbdfjrofycmgc > lib/supabase_generated_types.ts`
- [ ] Update `lib/global_types.ts` if new fields need derived types
- **Why:** Current types are missing 6 live DB columns (`is_blocked`, `is_suspended`, `suspension_reason`, `admin_locked`, `is_verified`, `companies.created_at`) AND 3 entire tables (`admin_audit_logs`, `job_reports`, `assessment_templates`) have no types at all

### TASK-07: Admin dashboard — layout + stats
- [ ] Replace "coming soon" stub with a proper admin layout (sidebar, nav)
- [ ] Stats cards: total users, total companies, total jobs, total applications
- **Files:** `src/app/admin/page.tsx` + new `src/app/admin/layout.tsx`

### TASK-08: Admin — job management
- [ ] View all jobs (all companies, all statuses)
- [ ] Lock a job: sets `admin_locked = true` → hidden from job seeker feed even if `is_active = true`
- [ ] Unlock a job: sets `admin_locked = false` → company can reactivate
- [ ] Update job feed query: filter out `admin_locked = true` jobs
- [ ] Update company job edit: prevent reactivation if `admin_locked = true`, show "Locked by admin" message
- **Files:** `src/app/admin/` (new pages), `lib/company/data.ts` (feed query), `src/app/company/jobs/[jobId]/EditJobForm.tsx`

### TASK-09: Admin — company management
- [ ] View all companies with verification status
- [ ] Verify a company: sets `is_verified = true` → verified badge shows next to company name
- [ ] Unverify a company
- [ ] Show verified badge in: company cards on job feed, applicant detail view, company profile
- **Files:** `src/app/admin/` (new pages), job card component, `lib/company/data.ts`

### TASK-10: Admin — user management
- [ ] View all users (job seekers + companies) with block/suspend status
- [ ] Block a user: sets `is_blocked = true` → remove from system (logout + deny access)
- [ ] Suspend a user: sets `is_suspended = true` + `suspension_reason` → notify via messaging + restrict access
- [ ] Add block/suspend check to middleware (redirect blocked/suspended users)
- [ ] Suspension details TBD — add to plan for future round
- **Files:** `src/app/admin/`, `lib/supabase/middleware.ts`

### TASK-11: Admin — job reports (proof feature)
**Job seeker side:**
- [ ] Add "Report" button to job cards in the job feed
- [ ] Report modal: reason input (free text), submit button
- [ ] Server action: insert into `job_reports` with `status = 'pending'`; prevent duplicate reports (same user + job)
- **Files:** `src/app/job-seeker/home/JobSeekerHomeClient.tsx`, new server action in `lib/company/actions.ts` or `lib/reports/actions.ts`

**Admin side:**
- [ ] `/admin/reports` page — list all reported jobs grouped by status (pending / reviewed / dismissed)
- [ ] Per report: job title, company name, reporter, reason, date, status
- [ ] Admin actions: mark as reviewed, dismiss, or lock the job directly from this view
- **Files:** new `src/app/admin/reports/page.tsx`

### TASK-12: Admin — audit log (proof feature)
**Write side (wire into every admin action):**
- [ ] After every admin mutation (lock job, unlock job, verify company, unverify company, block user, suspend user, review report, dismiss report), insert a row into `admin_audit_logs`
- [ ] Fields: `admin_id` (current user), `action` (string key), `target_type`, `target_id`, `target_label`, `reason`
- [ ] Extract a shared `logAdminAction(...)` helper to keep this DRY
- **Files:** all admin server actions

**Read side:**
- [ ] `/admin/audit-log` page — chronological list of all admin actions
- [ ] Columns: timestamp, admin name, action, target, reason
- [ ] Filter by action type and by admin (multi-admin support)
- **Files:** new `src/app/admin/audit-log/page.tsx`

---

## Sprint 4 — Notifications (Phase 4)
**Design confirmed in Round 2B (2026-05-03).** In-app only, load on visit, application-level inserts.

### TASK-12: Create `notifications` table in Supabase
- [ ] Create table with columns: `id`, `user_id`, `type`, `title`, `body`, `link`, `is_read`, `created_at`
- [ ] Add RLS: user can SELECT/UPDATE only their own rows; INSERT via service role in server actions
- [ ] Add index on `(user_id, created_at DESC)` for efficient feed queries

### TASK-13: Define deep-link URLs per notification type
During implementation, confirm the exact `link` value for each type:
- [ ] `application_status_changed` → `/job-seeker/job-applications` (or specific application view if one exists)
- [ ] `assessment_sent` → `/job-seeker/assessments`
- [ ] `assessment_results_released` → `/job-seeker/assessments` (specific assessment)
- [ ] `new_application` → `/company/jobs/[jobId]/applicants`
- [ ] `assessment_submitted` → `/company/applicants/[applicationId]`

### TASK-14: Wire notification inserts into server actions
Insert a `notifications` row after each triggering event (use service-role client):
- [ ] `updateApplicationStatus` → insert for job seeker (type: `application_status_changed`)
- [ ] `sendAssessment` → insert for job seeker (type: `assessment_sent`)
- [ ] `releaseAssessmentResults` → insert for job seeker (type: `assessment_results_released`)
- [ ] `applyToJob` → insert for company (type: `new_application`)
- [ ] `submitAssessment` → insert for company (type: `assessment_submitted`)
- **Files:** `lib/company/actions.ts`

### TASK-15: Replace job seeker notifications UI with real data
- [ ] Fetch notifications from DB on page load, grouped by date (Today / Yesterday / Earlier)
- [ ] "Mark all read" button sets `is_read = true` for all user's notifications
- [ ] Each notification links to its `link` URL on click
- **Files:** `src/app/job-seeker/notifications/page.tsx`

### TASK-16: Build company notifications page
- [ ] Create `/company/notifications` page (same layout pattern as job seeker)
- [ ] Fetch company's notifications on load
- [ ] "Mark all read" + deep links
- **Files:** new `src/app/company/notifications/page.tsx`

### TASK-17: Add unread count badge to sidebars
- [ ] Fetch `count` of `is_read = false` rows for current user on layout load
- [ ] Show badge on "Notifications" nav item for both job seeker and company sidebars
- **Files:** job seeker sidebar, company sidebar layout

---

## Sprint 5 — Messaging (Phase 5)
**Design confirmed in Round 2C (2026-05-03).** Supabase Realtime, 1-on-1, application-gated, text + attachments.

### TASK-18: Create `conversations` and `messages` tables in Supabase
- [ ] Create `conversations` table (id, application_id unique, job_seeker_id, company_id, created_at)
- [ ] Create `messages` table (id, conversation_id, sender_id, content, attachment_url, attachment_name, is_read, created_at)
- [ ] Add RLS: conversations visible only to job_seeker_id or company_id; messages visible to conversation participants
- [ ] Create `message-attachments` private storage bucket
- [ ] Add index on `(conversation_id, created_at ASC)` for message thread queries

### TASK-19: Server actions for messaging
- [ ] `getOrCreateConversation(applicationId)` — validates application exists between caller and target; creates conversation if none exists; returns conversation id
- [ ] `sendMessage(conversationId, content, attachment?)` — inserts message row; uploads attachment to storage if provided
- [ ] `markConversationRead(conversationId)` — sets `is_read = true` for all messages not sent by caller
- [ ] `getConversations()` — list all conversations for current user with last message preview + unread count
- [ ] `getMessages(conversationId)` — fetch full message thread (paginated if needed)
- **Files:** new `lib/messages/actions.ts`, `lib/messages/data.ts`

### TASK-20: Replace job seeker messages UI with real data
- [ ] Load conversations from DB on mount
- [ ] Wire Supabase Realtime subscription to new messages in active conversation
- [ ] Send message form (text + file attachment picker)
- [ ] File attachment: upload to `message-attachments`, display with signed URL + filename
- [ ] Unread badge on sidebar
- **Files:** `src/app/job-seeker/messages/page.tsx`

### TASK-21: Build company messages page
- [ ] Create `/company/messages` page with same two-panel layout
- [ ] Same data layer and Realtime wiring as job seeker
- [ ] Unread badge on company sidebar
- **Files:** new `src/app/company/messages/page.tsx`

---

## Sprint 6 — Assessment Templates (Company Feature)
**Design confirmed 2026-05-03.** Table already exists in DB. No code yet.

### TASK-22: Assessment template management pages
- [ ] `/company/assessments/templates` — list all company's templates (name, tags, use_count, updated_at)
- [ ] `/company/assessments/templates/new` — create template using same question builder as assessments
- [ ] `/company/assessments/templates/[templateId]` — edit or delete a template
- **Files:** new `src/app/company/assessments/templates/` pages

### TASK-23: Server actions for templates
- [ ] `createTemplate(data)` — insert into `assessment_templates`
- [ ] `updateTemplate(id, data)` — update template
- [ ] `deleteTemplate(id)` — delete template
- [ ] `getCompanyTemplates()` — list templates for current company
- [ ] `getTemplate(id)` — fetch single template for editing
- **Files:** new `lib/company/templates.ts`

### TASK-24: Wire templates into send-assessment flow
- [ ] Add "Load from template" option to the send-assessment form on `/company/applicants/[applicationId]`
- [ ] Selecting a template prefills the form fields (title, description, questions, time_limit)
- [ ] Company can still edit all fields before sending
- [ ] On successful send: increment `use_count` on the source template
- **Files:** send-assessment form component in `src/app/company/applicants/[applicationId]`

---

## Sprint 7 — Interview Simulator (Phase 7)
**Status:** Pending API key discussion.

### TASK-09: Wire interview simulator
- [ ] Obtain and add `OPENAI_API_KEY` to `.env.local`
- [ ] Test end-to-end: setup → questions → answers → feedback
- [ ] Optionally persist simulator sessions to DB

---

## Blocked Items (Needs Info)

| Task | Blocker |
|---|---|
| TASK-05: Status values | Need Supabase service key |
| TASK-07: Notifications | Need design decision + service key |
| TASK-08: Messaging | Need design decision + service key |
| TASK-09: Interview simulator | Need OpenAI API key |

---

## Done

*(Nothing marked done yet — starting fresh from Phase 1)*
