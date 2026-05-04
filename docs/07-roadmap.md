# 07 — Roadmap

> Last updated: 2026-05-04 | Phases 1–8 complete (Sprints 1–8)

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

## Phase 9 — Interview Simulator

- `OPENAI_API_KEY` configuration + end-to-end test
- Plan: add to env, test all flows (setup → questions → answers → feedback), optionally persist session history to DB

---

## Phase 8 — Post-MVP (After Submission)

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
- [x] Assessments: send, take, auto-score, review, release results
- [ ] AI Interview Simulator working (end-to-end with real API key) — **blocked: OPENAI_API_KEY missing**
- [ ] Email notifications fire on application status changes — **unknown: DB webhook trigger not verified in Supabase dashboard**
- [x] Profile publicly viewable without login
- [x] CV upload and download works (signed URLs)
- [x] Messaging works (real messages, Supabase Realtime)
- [x] Notifications work (real DB, 5 automatic triggers)
- [x] Admin dashboard shows real platform data
- [x] No broken routes in core flows
- [x] No orphaned dead code in the repo
