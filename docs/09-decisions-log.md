# 09 — Decisions Log

> Architectural and product decisions made during development. Ordered chronologically where known.

---

## 2026 — DB Restructure

**Decision:** Split user profile into `profiles` (base) + `job_seeker_profiles` + `companies` extension tables.

**Why:** A single `profiles` table with nullable columns for both roles creates ambiguity. Extension tables enforce 1:1 relationships and keep role-specific data separate.

**Impact:** All queries for a job seeker need two tables. Type system uses `FullJobSeekerProfile` to combine them.

---

## 2026 — Single DB Write Architecture for Onboarding

**Decision:** During the 4-step onboarding wizard, zero DB writes happen until the user clicks "Finish setup". All steps accumulate state in React, then a single `upsertProfile` fires at the end.

**Why:** Multi-step writes risk partial profiles (e.g., user gets to step 2 and closes). A single atomic write prevents orphaned incomplete data.

**Impact:** If the user closes mid-wizard, no incomplete row is created. They restart from step 1 on return.

---

## 2026 — CV Security via Signed URLs

**Decision:** CVs are stored in a private Supabase storage bucket. `job_seeker_profiles.cv_url` stores the storage path (e.g. `userId/cv.pdf`), not a public URL. Signed URLs are generated server-side at read time.

**Why:** CVs are sensitive PII. A public URL would allow anyone who guesses or scrapes the path to download anyone's CV. Signed URLs expire and are generated only for authorized requests.

**Impact:** Every CV read requires a server-side call to `createSignedUrl`. Cannot be done in Client Components.

---

## 2026 — `applicant_id` FK to `auth.users`

**Decision (inherited):** `job_applications.applicant_id` references `auth.users.id`, not `profiles.id`.

**Why this happened:** Supabase Auth creates users in `auth.users`. The FK was added pointing there rather than `profiles`. Both share the same UUID.

**Impact:** PostgREST cannot resolve nested joins from `job_applications` to `profiles` because it can't cross the `auth` schema boundary. All applicant profile fetches require a separate query.

---

## 2026 — Role Values: job_seeker / company / admin (not enum)

**Decision:** Role is stored as a plain `text` column in `profiles`, not a PostgreSQL enum.

**Why:** Easier to evolve. Adding a new role doesn't require a DB migration to alter an enum.

**Risk:** No DB-level constraint prevents invalid role values. Application code is the enforcement layer.

---

## 2026 — Application Status State Machine in Code

**Decision:** `ALLOWED_TRANSITIONS` in `lib/company/actions.ts` defines which status transitions are legal. Enforced at the action layer, not via DB constraints.

**Why:** DB check constraints on status transitions would require complex triggers. Application-level enforcement is more readable and maintainable.

**Risk:** Direct DB writes bypass this. Admin-level DB access could put applications in invalid states.

---

## 2026 — Assessment Results: Company Controls Release

**Decision:** Assessment results (score, per-question breakdown) are not visible to the job seeker until the company explicitly toggles `results_released = true`.

**Why:** Companies may want to review results before sharing, adjust scores, or add feedback. Releasing is a deliberate act.

**Impact:** After submission, job seeker sees "Your assessment has been submitted. Results will be shared by the company." until released.

---

## 2026 — Skill Matching: Rule-Based (not ML)

**Decision:** Skill matching is purely rule-based: `matchCount / matchTotal`. No ML or NLP.

**Why:** Rule-based is transparent, fast to implement, and predictable. ML matching is a post-MVP enhancement.

**Impact:** Skills must be exact matches (both from the same `skills` master table). Freeform skill strings don't contribute to match score.

---

## 2026 — OpenAI GPT-4o-mini for Interview Simulator

**Decision:** Interview simulator uses OpenAI's GPT-4o-mini model via a server-side API route.

**Why:** GPT-4o-mini offers a good balance of quality and cost for interview question generation and evaluation. Server-side route hides the API key from the browser.

**Impact:** Requires `OPENAI_API_KEY` environment variable. Feature is completely blocked without it.

---

## 2026-05-03 — Round 1 Confirmed Decisions

**Decision: Jobs go live immediately on post — no admin approval workflow.**

**Why:** Approval queues add friction for companies. Admin can lock a job after it's live if needed.

**Impact:** No `pending_approval` status or approval queue to build.

---

**Decision: Priority order E → A → B → C → D.**

Structural cleanup → env/bug fixes → admin panel → notifications → messaging.

**Why:** Dead code and broken env vars are fast wins that unblock everything else. Admin panel is highest-value for the graduation demo.

---

**Decision: Messaging and notifications will be Supabase-backed (not a third-party service).**

**Why:** Already using Supabase for everything. Supabase Realtime channels handle live updates. No extra service to manage or pay for.

**Impact:** Requires designing `conversations`, `messages`, and `notifications` tables. To be specced in rounds 2B and 2C.

---

**Decision: Interview simulator details and OpenAI API key — deferred to a future round.**

**Why:** API key not yet available. Design decisions deferred until key can be tested end-to-end.

---

## 2026-05-03 — Round 2A Confirmed Decisions (Admin Panel)

**Decision: Admin can lock jobs (`admin_locked = true`). Company cannot reactivate a locked job — must wait for admin to unlock.**

**Why:** Admin needs the ability to remove harmful/illegal job postings without permanently deleting them. Lock + unlock is reversible. Company is blocked from circumventing the lock by toggling `is_active`.

**Impact:** Job feed query must filter `admin_locked = true`. Company edit page must show "Locked by admin" and disable the active toggle when locked.

---

**Decision: Admin can verify companies (`is_verified = true`). Verified badge shown next to company name.**

**Why:** Verified badge signals to job seekers that the company is legitimate. Admins manually review and verify.

**Impact:** Badge must appear in: job feed cards, applicant detail view, and company profile.

---

**Decision: Block = permanent removal. Suspend = temporary restriction with messaging notification.**

- Block (`is_blocked = true`): user is removed from the system — forced logout and access denied.
- Suspend (`is_suspended = true`): user notified via the messaging system, access restricted. Reason stored in `profiles.suspension_reason`. Further details to be specced in a future round.

**Why:** Not all violations warrant permanent removal. Suspension is a lighter intervention with a defined reason.

**Impact:** Middleware must check both flags and redirect accordingly. Suspension notification requires messaging system to be working first.

---

**Decision: Admin panel scope = dashboard stats + job management + company management + user management. Plus "proof features" TBD.**

**Why:** Need to demonstrate admin authority across all entity types for the graduation demo. "Proof features" to be defined in a future interview round.

---

## 2026-05-03 — Round 2B Confirmed Decisions (Notifications)

**Decision: In-app notifications only (no email for this system). Load on page visit — no Realtime.**

**Why:** In-app is sufficient for the graduation demo. Email edge function already handles status change emails separately. Realtime adds complexity for minimal gain at this stage.

---

**Decision: One shared `notifications` table for all roles. Filtered by `user_id`.**

**Why:** Simpler than role-specific tables. Same query pattern, same RLS, same UI pattern for job seekers and companies.

---

**Decision: Notifications are inserted at the application layer (in Server Actions), not via DB triggers.**

**Why:** Server Actions already wrap every mutation. Inserting a notification row in the same action is straightforward and keeps the logic visible in the codebase rather than hidden in DB triggers.

---

**Decision: Companies get a notifications page too (`/company/notifications`).**

**Why:** Companies need to be notified of new applications and submitted assessments. Same design pattern as job seekers — no extra complexity.

---

**Decision: Deep links per notification type — exact URLs to be confirmed during TASK-13.**

**Why:** Each notification type has a natural destination (e.g. assessment sent → assessments page). URLs depend on whether per-item detail pages exist at implementation time.

---

## 2026-05-03 — Round 2C Confirmed Decisions (Messaging)

**Decision: Messaging is gated by an existing application — a conversation can only exist between a company and a job seeker who have an application together.**

**Why:** Prevents cold outreach and spam. Messaging is a continuation of the hiring flow, not a general social feature.

**Impact:** Server action must validate a `job_applications` row exists between both parties before creating a conversation or sending a message.

---

**Decision: One conversation per application. Lazy creation on first message.**

**Why:** One conversation per application keeps threads focused on the relevant job. Lazy creation avoids empty conversation rows.

---

**Decision: Supabase Realtime — messages appear instantly.**

**Why:** Messaging without live updates feels broken. Supabase Realtime `INSERT` subscription on `messages` filtered by `conversation_id` is the standard approach.

---

**Decision: Text + file attachments. Attachments stored in a private `message-attachments` bucket with signed URLs.**

**Why:** Users may need to share documents (updated CV, portfolio, offer letter). Same signed URL pattern used for CVs — secure, expiring links.

---

**Decision: Messaging UI is always a standalone section — not embedded in the applicant management page.**

**Why:** Keeps the applicant management flow focused on hiring decisions. Messages are accessed from the sidebar nav independently.

---

**Decision: Companies get a `/company/messages` page. Same layout as job seeker.**

**Why:** Companies are one side of every conversation. Same two-panel design, same data layer.

---

## 2026-05-03 — Admin Proof Features Confirmed

**Decision: Job reports are the first admin proof feature. Job seekers report jobs → admin reviews from dashboard.**

**Why:** Demonstrates admin moderation power. `job_reports` table already exists in the live DB. The report-to-review flow is a complete, demonstrable loop for the graduation demo.

**Impact:** Needs a Report button on job cards, a report modal, a server action, and `/admin/reports` page. Admin can also lock a job directly from the report view.

---

**Decision: Admin audit log is the second proof feature. Every admin action is recorded in `admin_audit_logs`.**

**Why:** Proves accountability and supports multi-admin setups — you can see which admin did what and when. `admin_audit_logs` table already exists in the live DB. Critical for a platform that will have multiple admins.

**Impact:** Every admin server action must insert a row into `admin_audit_logs` after the main operation. A shared `logAdminAction()` helper will be created to avoid repetition. `/admin/audit-log` page shows the full history with filters.

---

## 2026-05-03 — Assessment Templates (Company Feature)

**Decision: Companies can save reusable assessment templates to avoid rebuilding assessments from scratch each time.**

**Why:** Companies that frequently hire may send similar assessments for the same role. Templates let them build it once and reuse it, editing only what's different before sending.

**How to apply:** The send-assessment form gets a "Load from template" option. Selecting a template prefills all fields. Company can still edit before sending. `use_count` increments on each use so companies know which templates are most useful.

**Table already exists in DB:** `assessment_templates` with `company_id`, `title`, `description`, `questions` (jsonb), `time_limit`, `tags` (array), `use_count`, `created_at`, `updated_at`.

---

## 2026-05-29 — Forums MVP

**Decision: Forums use shared canonical routes, not role-prefixed routes.**

Routes are `/forums`, `/forums/[forumSlug]`, `/forums/[forumSlug]/new`, and `/forums/[forumSlug]/posts/[postId]`. Admin moderation lives at `/admin/forums`.

**Why:** The same community URL should continue working when company access is added later. Role access is enforced by layout guards, server actions, and RLS rather than by changing the route shape.

---

**Decision: Companies are blocked from forums for the MVP.**

**Why:** The current scope is student community support and admin moderation. Company participation can be enabled later by relaxing role checks and RLS policies without changing canonical routes.

---

**Decision: Anonymous forum content always stores the real `author_id`.**

**Why:** Normal users need privacy, while admins need accountability and moderation traceability. Public UI displays `Anonymous Job Seeker`; admin UI shows the real author plus an anonymous badge.

---

**Decision: Forum images use a private `forum-media` bucket and signed URLs.**

**Why:** The project already uses private storage + signed URLs for sensitive files. Forum media is not inline HTML; it is post attachment media rendered as a gallery.
