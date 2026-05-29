# Jsoor — Documentation

> **Spec-Driven Development docs — last full analysis: 2026-05-04 (Sprints 1–5 complete)**

---

## Document Index (New — Spec-Driven)

| Doc | Description | Status |
|---|---|---|
| [00 — Project Overview](./00-project-overview.md) | What Jsoor is, tech stack, roles, market, MVP goal | Complete |
| [01 — Current System State](./01-current-system-state.md) | What's implemented, what's missing, what's broken | Complete |
| [02 — Database Analysis](./02-database-analysis.md) | All tables, columns, relationships, RLS, mismatches | Complete |
| [03 — Requirements](./03-requirements.md) | Functional + non-functional requirements; open questions | Draft |
| [04 — User Roles & Permissions](./04-user-roles-and-permissions.md) | Role matrix, route guards, RLS | Complete |
| [05 — Features Specification](./05-features-specification.md) | Feature-by-feature spec with status | Complete |
| [06 — System Architecture](./06-system-architecture.md) | Architecture diagram, data flows, components | Complete |
| [07 — Roadmap](./07-roadmap.md) | Phase 1 fixes, Phase 2 MVP, Phase 3 post-MVP | Complete |
| [08 — Implementation Plan](./08-implementation-plan.md) | Task-by-task backlog with file references | Active |
| [09 — Decisions Log](./09-decisions-log.md) | Why key architectural decisions were made | Complete |
| [10 — Testing Plan](./10-testing-plan.md) | End-to-end flow checklists for demo | Complete |

---

## Legacy Documentation (Outdated — Do Not Use as Reference)

> ⚠️ The folders below are **pre-existing docs** from before the spec-driven analysis. They contain outdated DB schemas, wrong status values, outdated feature scopes, and decisions that have since changed. **The numbered docs (00–10) above are the authoritative source of truth.** The legacy folders are kept for historical reference only.

| Folder | Notes |
|---|---|
| [`01-product/`](./01-product/) | `overview.md` and `roadmap.md` are outdated (admin/messaging wrongly marked out of scope). `user-stories.md` updated 2026-05-04. |
| [`02-architecture/`](./02-architecture/) | `database-schema.md` is outdated (LEGACY header — use `02-database-analysis.md` instead). `system-overview.md` and `file-structure.md` updated 2026-05-04. |
| [`03-features/`](./03-features/) | `admin.md` and `messaging-notifications.md` are outdated (LEGACY headers). Other feature docs (`assessments.md`, `auth.md`, `cv-security.md`, etc.) are current. |
| [`07-specs/`](./07-specs/) | Original implementation specs — useful as historical context only |

---

## Spec-Driven Development Process

```
1. Identify feature or gap
2. Write a spec in docs/07-specs/<feature-name>.md
3. Break spec into concrete tasks
4. Implement step by step
5. Update docs/03-features/<feature>.md after implementation
```

Never implement a feature without a spec first.
Never merge a feature without updating its feature doc.

---

## Quick Status

| Feature | Status |
|---|---|
| Auth (login, signup, roles, email verification) | ✅ Done |
| Middleware: blocked/suspended user guards | ✅ Done |
| Landing page | ✅ Done |
| Job seeker onboarding (4-step wizard) | ✅ Done |
| Company onboarding | ✅ Done |
| Job discovery, apply, save, skill matching | ✅ Done |
| Job seeker profile (public view + edit) | ✅ Done |
| AI interview simulator | ✅ Done (API key needed) |
| Company job management (CRUD + skills) | ✅ Done |
| Company applicant management (status workflow + profile view) | ✅ Done |
| CV signed URL security | ✅ Done |
| Assessments V2 (typed questions, auto-score, timer, release) | ✅ Done |
| Saved / bookmarked jobs | ✅ Done |
| Skill-based job matching | ✅ Done |
| Email notifications (application status change) | ✅ Done — edge function deploy required |
| In-app notifications (all 5 triggers, both roles, unread badge) | ✅ Done |
| Real-time messaging (Supabase Realtime, attachments, both roles) | ✅ Done |
| Admin panel (dashboard, jobs, companies, users, reports, audit log) | ✅ Done |
| Assessment templates (create, edit, delete, load into send-assessment) | ✅ Done |
| Job seeker "Report job" button | ✅ Done — Flag icon + inline form + `reportJob` action |
| Job pagination (Show More) | ✅ Done — 9 per page, client-side, resets on filter/search |
| Settings pages | 🔲 Post-MVP |
| Arabic / RTL | 🔲 Post-MVP |
