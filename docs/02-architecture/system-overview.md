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
  → authenticated, no profile → redirect to onboarding

Role stored in: profiles.role (enum: job_seeker | company)
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
│   ├── home/                      ← job feed
│   ├── profile/[username]/        ← public profile view
│   ├── profile/[username]/edit/   ← own profile edit
│   ├── job-applications/          ← my applications
│   ├── assessments/               ← my assessments
│   ├── interview-simulator/       ← AI mock interview
│   ├── messages/                  ← placeholder
│   ├── notifications/             ← placeholder
│   └── onboarding/
│
├── company/
│   ├── layout.tsx                 ← Sidebar + TopBar wrapper
│   ├── home/                      ← dashboard stats
│   ├── profile/                   ← company profile
│   ├── onboarding/
│   ├── jobs/                      ← list all jobs
│   ├── jobs/new/                  ← create job
│   ├── jobs/[jobId]/              ← job detail / edit
│   ├── jobs/[jobId]/applicants/   ← applicant list
│   ├── applicants/[applicationId] ← individual application review
│   └── assessments/
│
└── api/
    └── ai/route.ts                ← OpenAI integration
```

---

## File Storage

| Bucket | Access | Contents | Signed URL? |
|---|---|---|---|
| `avatars` | Public | Profile photos | No (public URL) |
| `cvs` | Private | Candidate CVs | **Should be yes — not yet implemented** |

---

## Environment Variables

| Variable | Use |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `OPENAI_API_KEY` | OpenAI (set server-side only, not in NEXT_PUBLIC) |
