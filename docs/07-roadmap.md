# 07 — Roadmap

> Last updated: 2026-05-03 | Confirmed with project owner (Round 1 answers)

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

## Phase 1 — Structural Cleanup (Start Here)

| Task | Issue | Priority |
|---|---|---|
| Remove duplicate route `src/app/marketing/` | Routing conflict with `(marketing)` group | 🔴 First |
| Remove orphaned `src/app/Company/` (capital C) | Dead code, confusing | 🔴 First |
| Remove orphaned `src/app/Administrator/` | Dead code | 🔴 First |
| Audit `src/app/(marketing)/RENAMEDTODISABLElayout.tsx` — delete or rename | Left-over disabled layout | 🟠 High |
| Audit and remove other dead code (`src/dummy/`, `src/app/stitch-html/`) | Reference files, not live pages | 🟡 Medium |

---

## Phase 2 — Critical Bug Fixes

| Task | Issue | Priority |
|---|---|---|
| Add `NEXT_PUBLIC_SITE_URL` to `.env.local` | Auth email confirmation links use wrong base URL | 🔴 Critical |
| Fix `revalidatePath` in `lib/profile/actions.ts` | Profile page not refreshing after edits | 🟠 High |
| Verify `job_applications.status` DB values vs `ALLOWED_TRANSITIONS` | State machine may block valid transitions | 🟠 High — needs secret key |

---

## Phase 3 — Admin Panel (Full Dashboard)

Build a real admin panel at `/admin`. Scope to define in Round 2, but confirmed:
- Stats overview (users, companies, jobs, applications)
- User listing (job seekers + companies)
- Job listing (all jobs, ability to deactivate)
- **No** approve/reject workflow for jobs
- Admin-specific features to be defined in next interview round

---

## Phase 4 — Messaging (Real Backend)

Replace the hardcoded messages UI with real Supabase-backed messaging:
- Needs `conversations` and `messages` tables
- Supabase Realtime for live updates
- Design to be specified in an upcoming round
- Requires Supabase service/secret key to inspect current schema

---

## Phase 5 — Notifications (Real Backend)

Replace hardcoded notifications UI with real DB-backed notifications:
- Will use Supabase for delivery (exact approach TBD)
- `notifications` table with Supabase Realtime subscription
- Design to be specified in an upcoming round

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

## Technical Debt (Clean Up Alongside Other Work)

| Item | Action |
|---|---|
| `src/app/stitch-html/` HTML mockups | Delete |
| `src/dummy/` folder | Delete |
| `data/jobs.ts` static data | Verify unused → delete |
| `components/app-sidebar.tsx` (root level) | Audit — may be duplicate of `components/app/AppSidebar.tsx` |
| Hardcoded "Recent Setups" in interview simulator | Remove or wire to DB history |
| `components/TopBar.tsx`, `components/sidebar.tsx` (root) | Audit if used; delete if orphaned |

---

## Success Criteria for Academic Submission

- [ ] End-to-end hiring flow: post job → apply → manage → assess → decide
- [ ] All 3 roles (job_seeker, company, admin) access correct dashboards
- [ ] Assessments: send, take, auto-score, review, release results
- [ ] AI Interview Simulator working (end-to-end with real API key)
- [ ] Email notifications fire on application status changes
- [ ] Profile publicly viewable without login
- [ ] CV upload and download works (signed URLs)
- [ ] Messaging works (real messages, not hardcoded)
- [ ] Notifications work (real DB, not hardcoded)
- [ ] Admin dashboard shows real platform data
- [ ] No broken routes in core flows
- [ ] No orphaned dead code in the repo
