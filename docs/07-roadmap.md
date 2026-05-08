# 07 — Roadmap

> Last updated: 2026-05-08 | Phases 1–9 complete (Sprints 1–9); Sprint 10 dropped (Resend removed — in-app notifications sufficient); Sprint 11 interview simulator blocked on API key; Sprint 12 assessment flow fixes complete; Phase 13 UI polish pass complete; Phase 14 job detail slide-over sheet complete; Phase 15 job seeker profile redesign complete; Phase 16 company assessments data + navigation fix complete; Phase 17 UI bug fixes (logo rendering, profile avatar z-index, sheet accessibility) complete

---

## Deadline
**~1 month** to academic submission.

## Confirmed Decisions (Round 1)
- Jobs go live **immediately** on post — no admin approval needed ✅ (already the behavior)
- Admin panel needs a **full dashboard** (stats, user/company/job listing) — no approve/reject for jobs
- Messaging must **actually work** (Supabase Realtime) — to be designed in upcoming rounds
- Notifications will use **Supabase** for both notifications and messaging — secret key to be provided
- OpenAI API key and interview simulator details — to discuss in upcoming rounds

---

## Priority Order (Confirmed)
1. **E** — Clean up duplicate routes / structural debt
2. **A** — Fix critical env vars + `revalidatePath` bug
3. **B** — Admin panel (full dashboard, no job approval)
4. **C** — Real notifications (Supabase-backed)
5. **D** — Real messaging (Supabase Realtime)

---

## Phase 1 — Structural Cleanup ✅ COMPLETE (Sprint 1)

| Task | Status |
|---|---|
| Remove duplicate route `src/app/marketing/` | ✅ Deleted |
| Remove orphaned `src/app/Company/` (capital C) | ✅ Deleted |
| Remove orphaned `src/app/Administrator/` | ✅ Deleted |
| Remove `src/app/(marketing)/RENAMEDTODISABLElayout.tsx` | ✅ Deleted |
| Remove dead code (`src/dummy/`, `src/app/stitch-html/`, `data/jobs.ts`, orphaned root components) | ✅ Deleted |

---

## Phase 2 — Critical Bug Fixes ✅ COMPLETE (Sprint 2)

| Task | Status |
|---|---|
| Add `NEXT_PUBLIC_SITE_URL` to `.env.local` | ✅ Added |
| Fix `revalidatePath` in `lib/profile/actions.ts` | ✅ Fixed (correct dynamic path) |
| Verify `job_applications.status` DB values vs `ALLOWED_TRANSITIONS` | ✅ Verified via MCP — values match |

---

## Phase 3 — Admin Panel (Full Dashboard) ✅ COMPLETE (Sprint 3)

Built at `/admin`:
- Dashboard with live stat cards (users, companies, jobs, applications)
- Job management: lock/unlock any job; locked jobs hidden from job feed; reason logged
- Company management: verify/unverify companies
- User management: block (force sign-out) and suspend (→ `/auth/suspended` with reason) any user
- Job reports: review/dismiss reports; lock job directly from report view
- Audit log: chronological list of last 200 admin actions with color-coded action badges
- All actions auto-written to `admin_audit_logs`

---

## Phase 4 — Notifications (Real Backend) ✅ COMPLETE (Sprint 4)

Replaced hardcoded notifications UI with real Supabase-backed system:
- `notifications` table created via migration
- `lib/notifications/actions.ts`: `insertNotification` (service role — bypasses RLS), `getNotifications`, `markAllNotificationsRead`
- 5 automatic triggers wired in `lib/company/actions.ts`: `applyToJob`, `updateApplicationStatus`, `sendAssessment`, `submitAssessment`, `releaseAssessmentResults`
- Job seeker and company notification pages: DB-backed, grouped by Today/Yesterday/Earlier, deep links, mark-all-read
- Unread badge on Bell nav item in both sidebars

---

## Phase 5 — Messaging (Real Backend) ✅ COMPLETE (Sprint 5)

Replaced hardcoded messages UI with real Supabase Realtime messaging:
- `conversations` and `messages` tables created via migration
- `lib/messages/actions.ts`: `getOrCreateConversation`, `getJobSeekerConversations`, `getCompanyConversations`, `getMessages`, `sendMessage`, `markConversationRead`, `getUnreadMessageCount`
- Shared `components/app/MessagesClient.tsx` with Supabase Realtime (`postgres_changes` INSERT subscription per conversation), file attachment upload to `message-attachments` bucket, signed URL generation for downloads
- Job seeker and company messages pages use thin re-exports of the shared component
- "Message" button on company applicant detail: `getOrCreateConversation` → redirect to `/company/messages?conv=...`
- Unread message count badge on Messages nav item in both sidebars

---

## Phase 6 — Assessment Templates ✅ COMPLETE (Sprint 6)

Built at `/company/assessments/templates`:
- List page: all templates with name, tags, question count, use count; edit/delete per row; accessible via "Templates" button on the assessments page
- Create (`/templates/new`) and edit (`/templates/[templateId]`) using a full question builder (MCQ / True-False / Open), time limit, comma-separated tags
- "Load Template" picker in the send-assessment form on applicant detail — prefills title, instructions, time limit, and all questions; `use_count` increments on each use
- All actions in `lib/company/templates.ts` (company-scoped, ownership-checked)

---

## Phase 7 — Job Reporting + Pagination + Company Profile ✅ COMPLETE (Sprint 7)

- Job seeker "Report" button on every job card (Flag icon, inline form, `reportJob` server action)
- "Show More" pagination on job feed (client-side, 9 per page, resets on filter/search change)
- Company profile page verified as fully working (not a stub)

---

## Phase 8 — Messaging Bug Fixes + UI Polish ✅ COMPLETE (Sprint 8)

Fixed three production bugs in the messaging system and rewrote the chat UI:

- **Bug 1 (data):** `getJobSeekerConversations` used a broken PostgREST join — the FK `conversations_company_id_fkey` references `profiles`, not `companies`, so company name was always null. Fixed by fetching companies separately in a parallel query.
- **Bug 2 (data):** Empty `first_name`/`last_name` fields caused applicant name to render as `""`. Fixed with `fullName || "Applicant"` fallback in `buildSummaries`.
- **Bug 3 (sort):** Conversations were sorted by `created_at` (when conversation was created) instead of `last_message_at` (most recent activity). Fixed by sorting summaries by `last_message_at` DESC in `buildSummaries`.
- **UI:** `MessagesClient.tsx` fully rewritten — date separators, grouped timestamps, auto-resize textarea, error state, job title subtitle in conversation list.

---

## Phase 9 — Email Notifications ❌ DROPPED (2026-05-06)

Resend integration removed. In-app notifications (Phase 4) are sufficient for the submission. DB trigger and edge function deleted.

---

## Phase 10 — Notification Badge + Messaging Bug Fixes ✅ COMPLETE (2026-05-06)

- **Notification badge bug:** sidebar badge persisted across sessions — unread count was only cleared in local React state (pathname `useEffect`), never written back to DB. Fixed: both notification clients now call `markAllNotificationsRead()` silently on mount.
- **Messaging bug 1 (duplicate conversations):** `getOrCreateConversation` used `maybeSingle()` + separate `INSERT` — if the check missed the existing row, the INSERT hit the unique constraint and returned an error, silently killing the redirect from the applicant detail page. Fixed with check-then-insert + 23505 fallback.
- **Messaging bug 2 (sort order):** Sending a message updated `last_message_at` in state but never re-sorted the conversation list. Fixed by sorting by `last_message_at` DESC after every `setConversations` call in `MessagesClient`.
- **Messaging bug 3 (empty chats in list):** Clicking "Message" created a DB conversation before any message was sent, showing empty chats in the list permanently. Fixed by filtering out conversations with no messages from the left panel (`last_message !== ""`).
- **Messaging bug 4 (second Message click regression):** The upsert approach required an UPDATE RLS policy that didn't exist — second click always failed silently. Reverted to check-then-insert.
- **Auth page redesign:** All four auth pages (`login`, `sign-up`, `forgot-password`, `update-password`) updated from indigo/shadcn theme to match the system's green-on-warm-white design. Also fixed a stale redirect to `/protected` in `update-password-form`.
- **Landing page polish:** Navbar "Sign Up as Talent" → "Sign Up" (→ `/auth/sign-up`), "Hire with JSOOR" → "Log In" (→ `/auth/login`), fixed invalid `<button>` inside `<Link>` HTML. Removed dead "Post a Job" button from Hero. Floating card updated to "Intern / Connected Motion · Amman, Jordan". Stats bar now fetches real counts from DB (active jobs, companies, applications).

---

## Phase 10.6 — Assessment Flow Fixes ✅ COMPLETE (2026-05-06)

- **Score gating:** Job seeker no longer sees their score immediately after submission. `ConfirmationScreen` now shows "Results will be shared once the company reviews your submission." Score only appears in the list view when `results_released = true`.
- **Accepted status added:** `accepted` added to DB CHECK constraint on `job_applications.status`. New final positive status distinct from `shortlisted`.
- **Status transition fix:** `assessment_completed` had no entries in `ALLOWED_TRANSITIONS` — company was stuck with a static badge and no way to act after assessment. Fixed in both server-side guard (`lib/company/actions.ts`) and client dropdown (`ApplicantDetailClient.tsx`).
- **Full status flow:** `applied → under_review → [assessment_sent → assessment_completed] → shortlisted → accepted` or `rejected` at any post-review stage.

---

## Phase 11 — Interview Simulator

- `OPENAI_API_KEY` configuration + end-to-end test
- Plan: add to env, test all flows (setup → questions → answers → feedback), optionally persist session history to DB
- UI + API route fully built — just needs the key in `.env.local`

---

## Phase 14 — Job Detail Slide-Over Sheet ✅ COMPLETE (2026-05-08)

Added a right-side slide-over panel for full job details on the job seeker feed (`JobSeekerHomeClient.tsx`):

- Clicking the card body (title / description / skills area) slides in a 560px sheet from the right — Save, Report, and Apply buttons on the card are unaffected
- **Sheet header:** company logo, job title, match badge, meta pills (location, type, salary, posted date)
- **Sheet body:** full description (not truncated), requirements section (if set), all required skills with match counter ("X of Y matched")
- **Sheet footer (sticky):** Apply Now button expands into an inline cover letter form; submitting closes the sheet and marks the card as Applied; already-applied state shown with a green confirmation
- One shared Sheet instance at the parent level — switching cards just swaps the content with no re-mounting

---

## Phase 13 — UI Polish Pass ✅ COMPLETE (2026-05-08)

Fixed five bugs and dead-UI issues discovered during a systematic code review:

- **Missing `accepted` status** (`company/jobs/[jobId]/applicants/page.tsx`): The `accepted` status added in Phase 10.6 was never wired into the applicants list — no label, fallback gray badge, no filter. Fixed by adding `accepted` to `STATUS_STYLES`, `STATUS_LABELS`, and `FILTER_OPTIONS`.
- **Dead ArrowRight button** (`job-seeker/job-applications/JobApplicationsClient.tsx`): Non-assessment rows showed an arrow button with no click handler. Removed and replaced with contextual actions: `assessment_sent` → "Take Assessment", `assessment_completed` → "View Submission", all other statuses → no button.
- **Dead edit buttons on profile** (`job-seeker/profile/[username]/page.tsx`): Three sets of buttons were visible to all visitors (not just owners) with no handlers:
  - About section Plus button → converted to a `<Link>` to edit page, owner-only
  - Projects section Edit/Trash buttons → removed (editing is done on the edit page)
  - Skills section "Add Skill" button → converted to a `<Link>` to edit page, owner-only
- **Website URL bug** (same file): `href={\`https://${website}\`}` would produce `https://https://...` if the user saved a full URL. Fixed with `startsWith("http")` guard.
- **Status column too narrow** (`company/assessments/page.tsx`): Status column was `col-span-1` (~80px) — too narrow for badge text. Bumped to `col-span-2`; Job column reduced from 3→2 to keep grid at 12.

---

## Phase 15 — Job Seeker Profile Redesign ✅ COMPLETE (2026-05-08)

Full visual overhaul of `job-seeker/profile/[username]/page.tsx`:

- **Header** — replaced flat gray card with a green gradient banner; circular avatar overlaps the banner (LinkedIn-style); "Edit Profile" button moved to top-right corner
- **Section titles** — shrunk from `1.75rem` to `text-xs uppercase tracking-wider` labels for a cleaner hierarchy
- **About** — hidden from visitors when empty (no more "No bio added yet" shown publicly)
- **Projects** — replaced vertical timeline with compact card tiles (name, status badge, description, GitHub link)
- **Education details card** — icon-row layout per field (`GraduationCap`, `BookOpen`, `Star`, `Calendar`, `Globe`); CV download is a ghost button instead of heavy green CTA; entire section hidden when no fields are set
- **Skills** — switched to green-tinted pills (`bg-[#f0f9f5] text-[#005232]`); hidden from visitors when empty; "Add" link replaces "Add Skill" button
- **Certifications** — ExternalLink icon fades in on row hover
- All cards unified to `rounded-2xl border border-[#e5e2e1] shadow-sm` style

---

## Phase 16 — Company Assessments: Data Fix + Navigation ✅ COMPLETE (2026-05-08)

Fixed two bugs on `/company/assessments` and one on the applicant detail page:

- **Data bug (`getCompanyAssessments`)** — query returned empty array because PostgREST rejected the nested `profiles!job_applications_applicant_id_fkey` join; that FK points to `auth.users`, not `profiles`. Fixed with two-step query: assessments + job titles first, then a separate `profiles` SELECT by applicant IDs, merged in JS. Same root cause as the messaging bug fixed in Sprint 8.
- **Clickability bug** — applicant name was a `<span>` with no handler; entire card is now a `<Link>` to `/company/applicants/[applicationId]`. Removed the separate "Action / View →" column; columns rebalanced.
- **Name fallback** — empty `first_name`/`last_name` (incomplete test profiles) now render as `"Applicant"` in both the assessments list and the applicant detail page header.

---

## Phase 17 — UI Bug Fixes ✅ COMPLETE (2026-05-08)

Three small but visible bugs fixed:

- **Company logo rendering** — all `<img>` tags for company logos across 7 files (`/company/profile`, job feed cards, job detail sheet, My Applications, Saved Jobs, Assessments, Company Sidebar, Admin companies table) changed from `object-cover` (crops) to `object-contain` (fits); containers updated to `bg-white` + padding so transparent PNGs don't show tinted backgrounds.
- **Company profile upload UX** — duplicate "Change Photo / Upload Photo" text button removed; single camera-icon button on the avatar remains as the only trigger.
- **Profile avatar z-index** — avatar row at `/job-seeker/profile/[username]` was painted under the green banner because both elements shared the same stacking context. Fixed with `relative z-10` on the avatar row.
- **Sheet accessibility warning** — `SheetContent` (Radix Dialog) requires a `DialogTitle` for screen readers. Job title `<h2>` replaced with `<SheetTitle>` in `JobDetailSheet`; removes the console warning without any visual change.

---

## Phase 11 — Post-MVP (After Submission)

| Feature | Value | Effort |
|---|---|---|
| Platform-level assessments (skill tests) | High | High |
| Arabic language / RTL support | High (MENA market) | High |
| Company verification workflow | Medium | Medium |
| Mobile responsiveness audit | Medium | Medium |
| Candidate recommendation engine | High | Very High |

---

## Technical Debt

| Item | Status |
|---|---|
| `src/app/stitch-html/` HTML mockups | ✅ Deleted (Sprint 1) |
| `src/dummy/` folder | ✅ Deleted (Sprint 1) |
| `data/jobs.ts` static data | ✅ Deleted (Sprint 1) |
| `components/app-sidebar.tsx` (root level) | ✅ Deleted (Sprint 1) |
| `components/TopBar.tsx`, `components/sidebar.tsx` (root) | ✅ Deleted (Sprint 1) |
| Hardcoded "Recent Setups" in interview simulator | ⚠️ Still hardcoded — not wired to DB history |

---

## Success Criteria for Academic Submission

- [x] End-to-end hiring flow: post job → apply → manage → assess → decide
- [x] All 3 roles (job_seeker, company, admin) access correct dashboards
- [x] Assessments: send, take, auto-score, review, release results, accept/reject applicant
- [ ] AI Interview Simulator working (end-to-end with real API key) — **blocked: OPENAI_API_KEY missing**
- [x] Email notifications — dropped; in-app notifications cover this use case
- [x] Profile publicly viewable without login
- [x] CV upload and download works (signed URLs)
- [x] Messaging works (real messages, Supabase Realtime)
- [x] Notifications work (real DB, 5 automatic triggers)
- [x] Admin dashboard shows real platform data
- [x] No broken routes in core flows
- [x] No orphaned dead code in the repo
