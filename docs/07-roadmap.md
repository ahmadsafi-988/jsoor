# 07 — Roadmap

> Last updated: 2026-05-04 | Phases 1–5 complete (Sprints 1–5)

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

## Phase 6 — Interview Simulator

- `OPENAI_API_KEY` configuration + end-to-end test
- Discussion deferred to upcoming round
- Plan to wire: add to env, test all flows, optionally store session history in DB

---

## Phase 7 — Post-MVP (After Submission)

| Feature | Value | Effort |
|---|---|---|
| Platform-level assessments (skill tests) | High | High |
| Job pagination / infinite scroll | Medium | Low |
| Arabic language / RTL support | High (MENA market) | High |
| Company verification workflow | Medium | Medium |
| Mobile responsiveness audit | Medium | Medium |
| Candidate recommendation engine | High | Very High |
| Company profile public page | Medium | Low |

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
- [ ] Email notifications fire on application status changes — **unknown: edge function trigger not verified**
- [x] Profile publicly viewable without login
- [x] CV upload and download works (signed URLs)
- [x] Messaging works (real messages, Supabase Realtime)
- [x] Notifications work (real DB, 5 automatic triggers)
- [x] Admin dashboard shows real platform data
- [x] No broken routes in core flows
- [x] No orphaned dead code in the repo
