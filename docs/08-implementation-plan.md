# 08 — Implementation Plan

> Last updated: 2026-05-04 | Priority order confirmed by project owner

**Confirmed priority:** E → A → B → C → D (structural cleanup → env fixes → admin panel → notifications → messaging)

**Workflow for every task:**
1. Read/update spec
2. Get approval on approach
3. Implement
4. Verify manually
5. Mark done below

---

## Sprint 1 — Structural Cleanup (Phase 1) ✅ COMPLETE

### TASK-01: Remove duplicate and orphaned routes ✅
**Done 2026-05-04.**

- [x] Deleted `src/app/marketing/` folder entirely
- [x] Deleted `src/app/Company/` folder (capital C)
- [x] Deleted `src/app/Administrator/` folder
- [x] Deleted `src/app/(marketing)/RENAMEDTODISABLElayout.tsx`
- **Files removed:** `src/app/marketing/`, `src/app/Company/`, `src/app/Administrator/`, `src/app/(marketing)/RENAMEDTODISABLElayout.tsx`

### TASK-02: Delete dead code and reference files ✅
**Done 2026-05-04.**

- [x] Deleted `src/dummy/` folder (old page prototypes)
- [x] Deleted `src/app/stitch-html/` folder (HTML wireframes)
- [x] Deleted `data/jobs.ts` and empty `data/` folder (zero imports, confirmed safe)
- [x] Deleted `components/app-sidebar.tsx` (only used by dummy — real one is `components/app/AppSidebar.tsx`)
- [x] Deleted `components/TopBar.tsx` and `components/sidebar.tsx` (zero imports)
- [x] Deleted `components/nav-*.tsx/ts`, `chart-area-interactive.tsx`, `data-table.tsx`, `section-cards.tsx`, `site-header.tsx` (only referenced by dummy)

---

## Sprint 2 — Bug Fixes (Phase 2) ✅ COMPLETE

### TASK-03: Fix missing environment variables ✅
**Done 2026-05-04.**

- [x] Added `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to `.env.local`
- **Note:** OPENAI_API_KEY still missing — deferred to Sprint 7

### TASK-04: Fix `revalidatePath` in profile actions ✅
**Done 2026-05-04.**

- [x] Fixed 6 functions in `lib/profile/actions.ts`: `upsertProject`, `deleteProject`, `upsertBadge`, `deleteBadge`, `addProfileSkill`, `removeProfileSkill` — all now accept `username` and call `revalidatePath(/job-seeker/profile/${username})`
- [x] Updated `src/app/job-seeker/profile/[username]/edit/page.tsx`: added `username` prop to `TabProjects`, `TabBadges`, `TabSkills`; passes `params.username` to each
- [x] Updated `src/app/job-seeker/onboarding/page.tsx`: added `username` prop to `StepSkills`; passes `identity.username`

### TASK-05: Verify and align application status values
**BLOCKED — needs Supabase service key.**
- [ ] Query live `job_applications` for actual distinct status values
- [ ] Compare with `ALLOWED_TRANSITIONS` in `lib/company/actions.ts`
- [ ] Align code if they differ
- **Files:** `lib/company/actions.ts`

---

## Sprint 3 — Admin Panel (Phase 3) ✅ COMPLETE

### TASK-06: Update Supabase types ✅
**Done 2026-05-04.** (CLI login unavailable — types updated manually.)

- [x] Added `is_blocked: boolean`, `is_suspended: boolean`, `suspension_reason: string | null` to `profiles`
- [x] Added `admin_locked: boolean` to `jobs`
- [x] Added `is_verified: boolean` to `companies`
- [x] Added full type definitions for `admin_audit_logs`, `job_reports`, `assessment_templates` tables
- [x] Fixed pre-existing type bug in `lib/company/data.ts` `getJobApplicants` (was missing `job: null` in return)
- **Files:** `lib/supabase_generated_types.ts`, `lib/company/data.ts`

### TASK-07: Admin dashboard — layout + stats ✅
**Done 2026-05-04.**

- [x] Created `components/app/AdminSidebar.tsx` — dark sidebar with nav: Dashboard, Jobs, Companies, Users, Reports, Audit Log
- [x] Created `src/app/admin/layout.tsx` — sidebar + main content area
- [x] Replaced stub `src/app/admin/page.tsx` — live stat cards (users, companies, jobs, applications) + quick-nav links
- **Files:** `components/app/AdminSidebar.tsx`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`

### TASK-08: Admin — job management ✅
**Done 2026-05-04.**

- [x] Created `src/app/admin/jobs/page.tsx` + `AdminJobsClient.tsx`
- [x] Lock a job: sets `admin_locked = true`, prompts for reason, writes audit log
- [x] Unlock a job: sets `admin_locked = false`, writes audit log
- [x] Updated job feed query in `lib/company/data.ts`: added `.eq("admin_locked", false)` filter
- [x] Updated `src/app/company/jobs/[jobId]/EditJobForm.tsx`: shows red "Locked by admin" banner; `is_active` checkbox disabled when locked
- **Files:** `src/app/admin/jobs/`, `lib/company/data.ts`, `src/app/company/jobs/[jobId]/EditJobForm.tsx`

### TASK-09: Admin — company management ✅
**Done 2026-05-04.**

- [x] Created `src/app/admin/companies/page.tsx` + `AdminCompaniesClient.tsx`
- [x] Verify company: sets `is_verified = true`, writes audit log
- [x] Unverify company: sets `is_verified = false`, writes audit log
- [x] Verified badge shown inline in company table
- **Files:** `src/app/admin/companies/`

### TASK-10: Admin — user management ✅
**Done 2026-05-04.**

- [x] Created `src/app/admin/users/page.tsx` + `AdminUsersClient.tsx`
- [x] Block user: sets `is_blocked = true` with optional reason, writes audit log
- [x] Unblock user: sets `is_blocked = false`, writes audit log
- [x] Suspend user: sets `is_suspended = true` + `suspension_reason`, writes audit log
- [x] Unsuspend user: clears both fields, writes audit log
- [x] Updated `lib/supabase/middleware.ts`:
  - Blocked users → signed out + redirected to `/auth/login?error=account_blocked`
  - Suspended users → redirected to `/auth/suspended`
- [x] Created `src/app/auth/suspended/page.tsx` — shows suspension reason
- **Files:** `src/app/admin/users/`, `lib/supabase/middleware.ts`, `src/app/auth/suspended/page.tsx`

### TASK-11: Admin — job reports ✅
**Done 2026-05-04.**

- [x] Created `src/app/admin/reports/page.tsx` + `AdminReportsClient.tsx`
- [x] Reports grouped by status: pending / reviewed / dismissed
- [x] Actions: Mark reviewed, Dismiss, Lock job directly from report view
- [x] All actions write to `admin_audit_logs`
- **Files:** `src/app/admin/reports/`
- **Note:** Job seeker "Report" button on job cards not yet built (to add in a later pass)

### TASK-12: Admin — audit log ✅
**Done 2026-05-04.**

- [x] Created `src/app/admin/audit-log/page.tsx`
- [x] Shows last 200 actions with timestamp, admin name, action badge, target, reason
- [x] Color-coded action badges (red = lock/block, green = unlock/verify, yellow = suspend, blue = review)
- [x] `logAdminAction` helper in `lib/admin/actions.ts` called by every admin mutation
- **Files:** `src/app/admin/audit-log/page.tsx`, `lib/admin/actions.ts`, `lib/admin/data.ts`

---

## Sprint 4 — Notifications (Phase 4) ✅ COMPLETE
**Design confirmed in Round 2B (2026-05-03).** In-app only, load on visit, application-level inserts.
**Done 2026-05-04.**

### TASK-13: Create `notifications` table in Supabase ✅
- [x] Table created via MCP migration: `id`, `user_id` (→ profiles), `type`, `title`, `body`, `link`, `is_read`, `created_at`
- [x] RLS: SELECT/UPDATE own rows; INSERT for any authenticated user
- [x] Index on `(user_id, created_at DESC)`

### TASK-14: Deep-link URLs per notification type ✅
- [x] `application_status_changed` → `/job-seeker/job-applications`
- [x] `assessment_sent` → `/job-seeker/assessments`
- [x] `assessment_results_released` → `/job-seeker/assessments`
- [x] `new_application` → `/company/jobs/[jobId]/applicants`
- [x] `assessment_submitted` → `/company/applicants/[applicationId]`

### TASK-15: Wire notification inserts into server actions ✅
- [x] `applyToJob` → fetches job title + company_id, notifies company (`new_application`)
- [x] `updateApplicationStatus` → notifies job seeker (`application_status_changed`) with human-readable status label
- [x] `sendAssessment` → uses `.select("applicant_id")` on the application update, notifies job seeker (`assessment_sent`)
- [x] `submitAssessment` → uses `.select("company_id, title")` on the assessment update, notifies company (`assessment_submitted`)
- [x] `releaseAssessmentResults` → fetches applicant_id via application_id, notifies job seeker (`assessment_results_released`)
- **Files:** `lib/company/actions.ts`, `lib/notifications/actions.ts`
- **Note:** `insertNotification` uses service role client to bypass RLS for cross-user inserts

### TASK-16: Replace job seeker notifications UI with real data ✅
- [x] Server Component page fetches from DB, passes to `NotificationsClient`
- [x] Grouped by Today / Yesterday / Earlier; empty state; deep links; unread styling
- [x] "Mark all read" uses `useTransition` + `router.refresh()`
- **Files:** `src/app/job-seeker/notifications/page.tsx`, `src/app/job-seeker/notifications/NotificationsClient.tsx`

### TASK-17: Build company notifications page ✅
- [x] Same Server Component + Client pattern as job seeker
- [x] Empty state, date grouping, deep links, "Mark all read"
- **Files:** `src/app/company/notifications/page.tsx`, `src/app/company/notifications/CompanyNotificationsClient.tsx`

### TASK-18: Add unread count badge to sidebars ✅
- [x] `AppSidebar`: fetches unread count alongside profile in `useEffect`; red badge on Bell icon
- [x] `CompanySidebar`: same pattern; also added Notifications to company nav (was missing)
- **Files:** `components/app/AppSidebar.tsx`, `components/app/CompanySidebar.tsx`

---

## Sprint 5 — Messaging (Phase 5) ✅ COMPLETE
**Design confirmed in Round 2C (2026-05-03).** Supabase Realtime, 1-on-1, application-gated, text + attachments.
**Done 2026-05-04.**

### TASK-19: Create `conversations` and `messages` tables in Supabase ✅
- [x] `conversations` table: id, application_id (unique FK), job_seeker_id (→ profiles), company_id (→ profiles), created_at
- [x] `messages` table: id, conversation_id, sender_id (→ profiles), content, attachment_url, attachment_name, is_read, created_at
- [x] RLS: participants only for SELECT/INSERT/UPDATE on both tables
- [x] `message-attachments` private storage bucket (10MB limit) with authenticated upload/view policies
- [x] Index on `(conversation_id, created_at ASC)` + indexes on conversation foreign keys
- [x] `REPLICA IDENTITY FULL` + `supabase_realtime` publication for live updates
- **Files:** DB migration `create_conversations_messages`

### TASK-20: Server actions for messaging ✅
- [x] `getOrCreateConversation(applicationId)` — validates caller is applicant or company; upserts conversation
- [x] `getJobSeekerConversations()` — joins company name + job title; computes last_message + unread_count from messages
- [x] `getCompanyConversations()` — joins applicant name + job title; same aggregation
- [x] `getMessages(conversationId)` — verifies participant, returns messages ordered by created_at ASC
- [x] `sendMessage(conversationId, content, attachmentUrl?, attachmentName?)` — inserts message, returns row
- [x] `markConversationRead(conversationId)` — sets is_read=true for messages not sent by caller
- [x] `getUnreadMessageCount()` — counts unread messages for sidebar badge
- **Files:** `lib/messages/actions.ts`
- **Note:** attachment upload happens client-side via Supabase storage client; server action only stores the path

### TASK-21: Replace job seeker messages UI with real data ✅
- [x] Server component fetches conversations (SSR); passes to `MessagesClient`
- [x] `MessagesClient` (shared, in `components/app/MessagesClient.tsx`): two-panel layout, conversation list, chat thread
- [x] Supabase Realtime subscription on active conversation — new messages appear without refresh
- [x] Send message: text + file attachment (upload to `message-attachments` bucket, signed URL for download)
- [x] `markConversationRead` called on conversation switch; unread badge cleared in state
- [x] Unread message badge on Messages nav item in `AppSidebar`
- **Files:** `src/app/job-seeker/messages/page.tsx`, `components/app/MessagesClient.tsx`

### TASK-22: Build company messages page ✅
- [x] Same Server Component + shared MessagesClient pattern
- [x] Conversation list shows applicant name + job title (company perspective)
- [x] Messages nav item added to `CompanySidebar` with unread badge
- [x] "Message" button added to company's applicant detail page — calls `getOrCreateConversation` then redirects to `/company/messages?conv=...`
- **Files:** `src/app/company/messages/page.tsx`, `components/app/CompanySidebar.tsx`, `src/app/company/applicants/[applicationId]/ApplicantDetailClient.tsx`

---

## Sprint 6 — Assessment Templates (Company Feature)
**Design confirmed 2026-05-03.** Table already exists in DB. No code yet.

### TASK-23: Assessment template management pages
- [ ] `/company/assessments/templates` — list all company's templates (name, tags, use_count, updated_at)
- [ ] `/company/assessments/templates/new` — create template using same question builder as assessments
- [ ] `/company/assessments/templates/[templateId]` — edit or delete a template
- **Files:** new `src/app/company/assessments/templates/` pages

### TASK-24: Server actions for templates
- [ ] `createTemplate(data)` — insert into `assessment_templates`
- [ ] `updateTemplate(id, data)` — update template
- [ ] `deleteTemplate(id)` — delete template
- [ ] `getCompanyTemplates()` — list templates for current company
- [ ] `getTemplate(id)` — fetch single template for editing
- **Files:** new `lib/company/templates.ts`

### TASK-25: Wire templates into send-assessment flow
- [ ] Add "Load from template" option to the send-assessment form
- [ ] Selecting a template prefills all form fields
- [ ] Company can still edit all fields before sending
- [ ] On successful send: increment `use_count` on the source template
- **Files:** send-assessment form component in `src/app/company/applicants/[applicationId]`

---

## Sprint 7 — Interview Simulator
**Status:** Pending API key.

### TASK-26: Wire interview simulator
- [ ] Obtain and add `OPENAI_API_KEY` to `.env.local`
- [ ] Test end-to-end: setup → questions → answers → feedback
- [ ] Optionally persist simulator sessions to DB

---

## Remaining Known Issues

| Issue | Status |
|---|---|
| TASK-05: Verify application status values vs DB | Resolved — status values confirmed via `list_tables` MCP call; `ALLOWED_TRANSITIONS` matches live DB constraint |
| Job seeker "Report" button on job cards | Not yet built (admin reports page is ready to receive them) |
| Show More button on job feed has no pagination | Not yet addressed |
| Company profile page — unknown state | Not verified |
| OPENAI_API_KEY missing | Deferred to Sprint 7 |
| Supabase types — CLI regeneration | Still manual; run `npx supabase gen types typescript --project-id hmisspubbdfjrofycmgc > lib/supabase_generated_types.ts` once login is available |

---

## Done

- [x] TASK-01: Remove duplicate and orphaned routes
- [x] TASK-02: Delete dead code and reference files
- [x] TASK-03: Fix missing environment variables (`NEXT_PUBLIC_SITE_URL`)
- [x] TASK-04: Fix `revalidatePath` in profile actions
- [x] TASK-06: Update Supabase types (manual — CLI unavailable)
- [x] TASK-07: Admin dashboard layout + stats
- [x] TASK-08: Admin job management (lock/unlock + feed filter + EditJobForm banner)
- [x] TASK-09: Admin company management (verify/unverify)
- [x] TASK-10: Admin user management (block/suspend + middleware + suspended page)
- [x] TASK-11: Admin job reports
- [x] TASK-12: Admin audit log
- [x] TASK-13: Create `notifications` table (MCP migration, RLS, index)
- [x] TASK-14: Deep-link URLs confirmed and implemented
- [x] TASK-15: Wire notification inserts into 5 server actions
- [x] TASK-16: Job seeker notifications page — real DB data
- [x] TASK-17: Company notifications page — built from scratch
- [x] TASK-18: Unread badge on both sidebars; Notifications added to CompanySidebar nav
- [x] TASK-19: Create `conversations` and `messages` tables (MCP migration, RLS, Realtime, storage bucket)
- [x] TASK-20: Server actions — getOrCreate, getConversations (job seeker + company), getMessages, sendMessage, markRead, unreadCount
- [x] TASK-21: Job seeker messages page — real data, Realtime, attachments, unread badge
- [x] TASK-22: Company messages page — same pattern; "Message" button on applicant detail; Messages added to CompanySidebar nav
