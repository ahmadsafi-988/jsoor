# System Overview

> Source: Inferred from codebase.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 |
| UI Runtime | React | 19.2.4 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| Component Library | Shadcn/ui (radix-nova style) | — |
| Icons | Lucide React | 1.6.0 |
| Animation | Motion (Framer Motion) | 12.38.0 |
| Database | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth | — |
| File Storage | Supabase Storage | — |
| AI | OpenAI API (gpt-4o-mini) | — |
| Font | Space Grotesk | — |

---

## Authentication & Authorization

```
User signs up
  → chooses role: job_seeker | company
  → email confirmation
  → redirected to /<role>/onboarding

On every request:
  middleware.ts reads Supabase session cookie
  → unauthenticated → redirect to /auth/login
  → authenticated → role-based redirect on login (company → /company/home, job_seeker → /job-seeker/home)

Role stored in: profiles.role (enum: job_seeker | company | admin)
```

**Protected routes (middleware):**
- `/job-seeker/*` — requires `role = job_seeker`
- `/company/*` — requires `role = company`
- `/admin` — requires `role = admin` (checked server-side in page, not middleware)

**Role guard in middleware:**
- If an `admin` user hits `/job-seeker/*` or `/company/*` → redirected to `/admin`
- Role is fetched from `profiles` table, scoped only to dashboard routes to avoid per-request DB cost

**Public routes:**
- `/` (landing)
- `/auth/*`
- `/job-seeker/profile/[username]` (public profile)

---

## Data Flow

```
Server Components (RSC)
  └── lib/*/data.ts          (read-only queries via async Supabase server client)

Client Components
  └── lib/supabase/client.ts (browser Supabase client for reactive/client-side ops)

Server Actions
  └── lib/*/actions.ts       (mutations: insert, update, delete)
      uses revalidatePath() to invalidate cached RSC data

API Routes
  └── src/app/api/ai/route.ts  (OpenAI: interview question generation + evaluation)
```

**Server/client component split pattern:**
- Server component fetches data + handles auth guard
- Passes plain data props to a `*Client.tsx` component that owns interactive state
- Mutations go through server actions in `lib/*/actions.ts`

---

## Routing Structure

```
src/app/
├── layout.tsx                     ← global layout (font, globals.css)
├── middleware.ts                  ← auth + role guard
│
├── (marketing)/page.tsx           ← landing page (route group, no URL prefix)
│
├── auth/
│   ├── login/
│   ├── sign-up/
│   ├── sign-up-success/
│   ├── forgot-password/
│   ├── update-password/
│   ├── confirm/route.ts           ← email confirmation API endpoint
│   └── error/
│
├── job-seeker/
│   ├── layout.tsx                 ← Sidebar + TopBar wrapper
│   ├── home/                      ← job feed with skill matching + search/filter
│   ├── profile/page.tsx           ← redirect: username lookup → /profile/[username] or /onboarding
│   ├── profile/[username]/        ← public profile view
│   ├── profile/[username]/edit/   ← own profile edit (tabbed: profile, projects, badges, account, skills)
│   ├── job-applications/          ← my applications (status filter tabs)
│   ├── saved-jobs/                ← bookmarked jobs
│   ├── assessments/               ← my assessments (view + submit)
│   ├── interview-simulator/       ← AI mock interview
│   ├── messages/                  ← real DB + Supabase Realtime
│   ├── notifications/             ← real DB-backed notifications
│   └── onboarding/
│
├── company/
│   ├── layout.tsx                 ← Sidebar + TopBar wrapper
│   ├── home/                      ← dashboard stats
│   ├── profile/                   ← company profile
│   ├── onboarding/
│   ├── jobs/                      ← list all jobs
│   ├── jobs/new/                  ← create job (with SkillPicker)
│   ├── jobs/[jobId]/              ← job detail / edit (with SkillPicker)
│   ├── jobs/[jobId]/applicants/   ← applicant list (URL-based status filter)
│   ├── applicants/[applicationId] ← individual application review (status + assessment + CV + Message button)
│   ├── messages/                  ← real DB + Supabase Realtime (company perspective)
│   ├── notifications/             ← real DB-backed notifications (company perspective)
│   └── assessments/               ← assessment list + review
│
├── admin/
│   ├── layout.tsx                 ← AdminSidebar wrapper
│   ├── page.tsx                   ← dashboard with live stats
│   ├── jobs/                      ← lock/unlock jobs
│   ├── companies/                 ← verify/unverify companies
│   ├── users/                     ← block/suspend users
│   ├── reports/                   ← review/dismiss job reports
│   └── audit-log/                 ← full admin action history
└── api/
    └── ai/route.ts                ← OpenAI integration
```

---

## File Storage

| Bucket | Access | Contents | URL Strategy |
|---|---|---|---|
| `avatars` | Public | Profile photos | Public URL — no expiry needed |
| `cvs` | Private | Candidate CVs | Storage path saved in DB; signed URL generated server-side at read time via `lib/storage/cv.ts` |

---

## Key Library Files

| File | Purpose |
|---|---|
| `lib/company/data.ts` | Company-side queries: jobs, applicants, assessments, saved jobs, skill matching — applicant queries use two-step fetch (applications → profiles separately) due to FK boundary with `auth.users` |
| `lib/company/actions.ts` | Company mutations + job seeker actions (apply, save/unsave job, submit assessment) — wires 5 notification inserts |
| `lib/profile/profile_data.ts` | Job seeker profile queries; `getProfileByUsername` handles missing `job_seeker_profiles` gracefully |
| `lib/profile/actions.ts` | Profile mutations (upsert profile, projects, badges, skills, avatar/CV URL) |
| `lib/storage/upload.ts` | Client-side file upload helpers (avatar → public URL, CV → storage path only) |
| `lib/storage/cv.ts` | Server-side `getCvSignedUrl()` — handles both old full-URL and new path-only `cv_url` values |
| `lib/notifications/actions.ts` | `insertNotification` (service role bypass RLS), `getNotifications`, `markAllNotificationsRead` |
| `lib/messages/actions.ts` | `getOrCreateConversation`, `getJobSeekerConversations`, `getCompanyConversations`, `getMessages`, `sendMessage`, `markConversationRead`, `getUnreadMessageCount` |
| `lib/admin/data.ts` | Admin read queries: stats, all jobs/companies/users/reports, audit log |
| `lib/admin/actions.ts` | Admin mutations (lock/unlock, verify, block/suspend, report review) — all auto-log to `admin_audit_logs` |
| `components/app/SkillPicker.tsx` | Toggleable skill chip selector; serializes to hidden `skill_ids` JSON input |
| `components/app/MessagesClient.tsx` | Shared two-panel chat UI: Realtime subscription, file attachments, conversation list, unread management |

---

## Environment Variables

| Variable | Use |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `NEXT_PUBLIC_SITE_URL` | Base URL of the app — used in email confirmation `redirectTo` (e.g. `http://localhost:3000`; update to production URL on deploy) |
| `OPENAI_API_KEY` | OpenAI (set server-side only, not in NEXT_PUBLIC) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — used server-side for cross-user notification inserts (bypasses RLS) |
| `RESEND_API_KEY` | Resend email provider — needed when email notifications Edge Function is deployed |
