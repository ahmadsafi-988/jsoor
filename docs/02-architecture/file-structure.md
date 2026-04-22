# File Structure

> Source: Inferred from codebase.

---

## Top-Level Layout

```
jsoor/
├── src/
│   ├── app/                   ← Next.js App Router (pages, layouts, API routes)
│   └── middleware.ts          ← Supabase auth middleware (route protection)
│
├── components/
│   ├── ui/                    ← Shadcn/ui primitives (50+ components, do not edit)
│   ├── app/                   ← Layout components (sidebars, topbars, SkillPicker)
│   ├── landing/               ← Landing page sections
│   ├── supabase/              ← Auth forms
│   ├── profile/               ← Profile UI components
│   └── interview-simulator/   ← Interview-specific UI
│
├── lib/
│   ├── supabase/              ← Supabase client setup (browser + server)
│   ├── profile/               ← Profile data fetching + server actions
│   ├── company/               ← Company data fetching + server actions
│   └── storage/               ← File upload + CV signed URL utilities
│
├── types/                     ← TypeScript type definitions
├── hooks/                     ← Custom React hooks
├── data/                      ← Static/mock data (dev use)
├── public/                    ← Static assets
└── docs/                      ← This documentation
```

---

## Key Files

| File | Purpose |
|---|---|
| `src/middleware.ts` | Route guard: checks Supabase session, redirects unauthenticated users |
| `src/app/layout.tsx` | Root layout: font, global styles |
| `lib/supabase/client.ts` | Browser Supabase client (`createBrowserClient`) |
| `lib/supabase/server.ts` | Server Supabase client (`createServerClient`) |
| `lib/supabase/middleware.ts` | Session refresh logic for middleware |
| `lib/supabase_generated_types.ts` | Auto-generated DB types — do not edit manually |
| `lib/global_types.ts` | Composite frontend types (e.g. `FullJobSeekerProfile`, `JobWithSkillsAndMatch`) |
| `lib/utils.ts` | `cn()` utility for Tailwind class merging |
| `lib/storage/upload.ts` | Client-side upload helpers — avatar (public URL) + CV (path only) |
| `lib/storage/cv.ts` | Server-side `getCvSignedUrl()` — converts stored path to signed URL |
| `lib/company/data.ts` | All company + job seeker read queries including skill matching |
| `lib/company/actions.ts` | All mutations: jobs, applications, assessments, saved jobs |
| `lib/profile/profile_data.ts` | Profile read queries; handles missing `job_seeker_profiles` gracefully |
| `lib/profile/actions.ts` | Profile mutations: upsert profile, projects, badges, skills, avatar/CV |
| `components/app/SkillPicker.tsx` | Reusable skill chip selector used in job create/edit forms |
| `components.json` | Shadcn/ui config (style: radix-nova, icons: lucide) |

---

## Naming Conventions

| Pattern | Meaning |
|---|---|
| `lib/*/data.ts` | Read-only data fetching functions (queries) |
| `lib/*/actions.ts` | Server Actions for mutations (insert/update/delete) |
| `*Client.tsx` | Client component paired with a server component page |
| `components/ui/` | Shadcn primitives — do not customize here |
| `components/app/` | App-level layout and shared interactive components |
| `page.tsx` | Next.js page component |
| `layout.tsx` | Next.js layout wrapper |
| `route.ts` | Next.js API route handler |

---

## Development Artifacts (Ignore)

| Path | Notes |
|---|---|
| `src/app/stitch-html/` | Archived HTML mockups from Stitch — not integrated |
| `src/dummy/` | Old component playground — not part of the app |
| `src/app/marketing/page.tsx` | Stub placeholder — 3 lines, not the real landing page |
