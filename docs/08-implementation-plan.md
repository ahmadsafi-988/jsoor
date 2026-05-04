# 08 — Implementation Plan

> Last updated: 2026-05-04 | Sprints 1–8 complete | Priority order confirmed by project owner

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

### TASK-05: Verify and align application status values ✅
**Done 2026-05-04** — verified via MCP `list_tables` call; `ALLOWED_TRANSITIONS` in `lib/company/actions.ts` matches live DB values exactly. No changes needed.
- [x] Queried live `job_applications` for distinct status values
- [x] Confirmed values match `ALLOWED_TRANSITIONS`: `pending`, `under_review`, `assessment_sent`, `assessment_completed`, `shortlisted`, `rejected`
- **Files:** `lib/company/actions.ts` (no changes required)

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
- **Note:** Job seeker "Report" button completed in Sprint 7 (TASK-26)

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

## Sprint 6 — Assessment Templates (Company Feature) ✅ COMPLETE
**Design confirmed 2026-05-03.** Table already exists in DB.
**Done 2026-05-04.**

### TASK-23: Assessment template management pages ✅
- [x] `/company/assessments/templates` — list: name, tags, question count, use_count, edit/delete per row
- [x] `/company/assessments/templates/new` — create form with same question builder; tags (comma-separated)
- [x] `/company/assessments/templates/[templateId]` — edit form pre-populated from DB; delete via list
- [x] "Templates" button added to `/company/assessments` page header for navigation
- **Files:** `src/app/company/assessments/templates/page.tsx`, `TemplatesClient.tsx`, `TemplateFormClient.tsx`, `templates/new/page.tsx`, `templates/[templateId]/page.tsx`

### TASK-24: Server actions for templates ✅
- [x] `getCompanyTemplates()` — fetches all templates for current company, ordered by updated_at DESC
- [x] `getTemplate(id)` — fetches single template (company-scoped, for edit page)
- [x] `createTemplate(formData)` — validates name, parses tags/questions, inserts, revalidates, redirects
- [x] `updateTemplate(id, formData)` — same validation, updates row, revalidates, redirects
- [x] `deleteTemplate(id)` — company-scoped delete, revalidates list
- **Files:** `lib/company/templates.ts`

### TASK-25: Wire templates into send-assessment flow ✅
- [x] `getCompanyTemplates()` fetched in server page alongside assessment; passed as `templates` prop
- [x] "Load Template" button in assessment form header — opens dropdown of company's templates
- [x] Selecting a template prefills title, instructions, time limit, and all questions via refs
- [x] Button label changes to "Template Loaded ✓" after selection
- [x] Hidden `template_id` field injected into formData on send
- [x] `sendAssessment` reads `template_id` and increments `use_count` on the template after successful insert
- **Files:** `src/app/company/applicants/[applicationId]/page.tsx`, `ApplicantDetailClient.tsx`, `lib/company/actions.ts`

---

## Sprint 7 — Job Reporting + Pagination + Company Profile ✅ COMPLETE
**Done 2026-05-04.**

### TASK-26: Job seeker "Report" button ✅
- [x] Added `reportJob(jobId, reason)` server action to `lib/company/actions.ts`
- [x] Inserts into `job_reports` with `status: 'pending'`; returns `{ error: "already reported" }` on duplicate (23505)
- [x] Added Flag icon button to every `JobCard` in `JobSeekerHomeClient.tsx`
- [x] Clicking Flag opens inline form (reason textarea, Cancel, Submit Report)
- [x] On success: form closes, Flag replaced with "Reported" label; report flows to `/admin/reports`
- **Files:** `lib/company/actions.ts`, `src/app/job-seeker/home/JobSeekerHomeClient.tsx`

### TASK-27: Job feed pagination ("Show More") ✅
- [x] Added `PAGE_SIZE = 9` constant and `visibleCount` state to `JobSeekerHomeClient`
- [x] `allFiltered` array holds all matching jobs; `displayed = allFiltered.slice(0, visibleCount)`
- [x] "Show More Opportunities" button calls `setVisibleCount(c => c + PAGE_SIZE)`; hidden when all jobs visible
- [x] Filter tab switches and search input changes reset `visibleCount` to `PAGE_SIZE`
- [x] Opportunity count badge now reflects `allFiltered.length` (total), not just visible count
- **Files:** `src/app/job-seeker/home/JobSeekerHomeClient.tsx`

### TASK-28: Verify company profile page ✅
- [x] Confirmed `src/app/company/profile/page.tsx` is fully implemented (not a stub)
- [x] Loads existing company data + username from Supabase client-side
- [x] Form fields: name, username, description, industry, size, location, founded year, website
- [x] Saves via `upsertCompany` server action; writes both `companies` and `profiles` tables
- **Files:** `src/app/company/profile/page.tsx` (no changes needed)

---

## Sprint 8 — Messaging Bug Fixes + UI Polish ✅ COMPLETE

### TASK-29: Fix broken company name join in `getJobSeekerConversations` ✅
**Done 2026-05-04.**

- [x] Identified: PostgREST join `company:companies!conversations_company_id_fkey` silently failed — FK references `profiles`, not `companies`
- [x] Removed broken join from the `conversations` select query
- [x] Added separate parallel `companies.select("id, name, logo_url").in("id", companyIds)` query
- [x] Built `companyMap` and passed it into `buildSummaries` as optional parameter
- **Files:** `lib/messages/actions.ts`

### TASK-30: Fix empty applicant name in `buildSummaries` ✅
**Done 2026-05-04.**

- [x] Old: `s ? \`${s.first_name} ${s.last_name}\`.trim() : "Applicant"` — `s` truthy with empty fields → `""`
- [x] New: `const fullName = \`${s?.first_name ?? ""} ${s?.last_name ?? ""}\`.trim(); otherName = fullName || "Applicant"`
- **Files:** `lib/messages/actions.ts`

### TASK-31: Fix conversation sort order ✅
**Done 2026-05-04.**

- [x] Conversations were sorted by `created_at` (conversation creation time), not activity time
- [x] Added sort by `last_message_at` DESC at the end of `buildSummaries` — applies to both job seeker and company
- **Files:** `lib/messages/actions.ts`

### TASK-32: Rewrite `MessagesClient.tsx` UI ✅
**Done 2026-05-04.**

- [x] Date separators between messages from different days (`formatDateLabel` + `isSameDay` helpers)
- [x] Timestamps shown only at end of consecutive same-sender message blocks
- [x] Auto-resizing textarea (`textareaRef` + `useEffect` on input value)
- [x] Enter to send, Shift+Enter for newline; hint text below input
- [x] Error state (`AlertCircle`) with "Try again" link if `getMessages` returns an error
- [x] Conversation list: name as primary label, job title as green subtitle
- **Files:** `components/app/MessagesClient.tsx`

---

## Sprint 9 — Sidebar Badge UX Fix ✅ COMPLETE

### TASK-33: Clear unread badge immediately on page visit ✅
**Done 2026-05-04.**

- [x] Added `useEffect` watching `pathname` in `AppSidebar.tsx` — sets `unreadMsgs(0)` when on `/job-seeker/messages`, sets `unreadNotifs(0)` when on `/job-seeker/notifications`
- [x] Same fix in `CompanySidebar.tsx` for `/company/messages` and `/company/notifications`
- [x] Badge now disappears the moment the user navigates to those pages — no refresh needed
- **Files:** `components/app/AppSidebar.tsx`, `components/app/CompanySidebar.tsx`

---

## Sprint 10 — Interview Simulator
**Status:** Pending API key.

### TASK-34: Wire interview simulator
- [ ] Obtain and add `OPENAI_API_KEY` to `.env.local`
- [ ] Test end-to-end: setup → questions → answers → feedback
- [ ] Optionally persist simulator sessions to DB

---

## Remaining Known Issues

| Issue | Status |
|---|---|
| TASK-05: Verify application status values vs DB | Resolved — status values confirmed via `list_tables` MCP call; `ALLOWED_TRANSITIONS` matches live DB constraint |
| OPENAI_API_KEY missing | Deferred to Sprint 10 |
| Supabase types — CLI regeneration | Still manual; run `npx supabase gen types typescript --project-id hmisspubbdfjrofycmgc > lib/supabase_generated_types.ts` once login is available |
| Email edge function trigger | Unknown — edge function exists but DB webhook not verified in Supabase dashboard |

---

## Done

- [x] TASK-01: Remove duplicate and orphaned routes
- [x] TASK-02: Delete dead code and reference files
- [x] TASK-03: Fix missing environment variables (`NEXT_PUBLIC_SITE_URL`)
- [x] TASK-04: Fix `revalidatePath` in profile actions
- [x] TASK-05: Verify application status values vs DB — confirmed match, no changes needed
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
- [x] TASK-23: Assessment template list, create, edit, delete pages
- [x] TASK-24: `lib/company/templates.ts` — all template server actions
- [x] TASK-25: "Load Template" picker in send-assessment form; `use_count` incremented on send
- [x] TASK-26: Job seeker "Report" button — `reportJob` action + Flag icon + inline form on job cards
- [x] TASK-27: Job feed pagination — "Show More" (9 per page, client-side slice, resets on filter/search)
- [x] TASK-28: Company profile page — verified as fully working
- [x] TASK-29: Fix broken PostgREST join in `getJobSeekerConversations` — fetch companies separately
- [x] TASK-30: Fix empty applicant name fallback in `buildSummaries`
- [x] TASK-31: Fix conversation sort order — sort by `last_message_at` DESC
- [x] TASK-32: Rewrite `MessagesClient.tsx` — date separators, grouped timestamps, error state, auto-resize textarea
- [x] TASK-33: Clear unread badge immediately when user visits messages or notifications page
