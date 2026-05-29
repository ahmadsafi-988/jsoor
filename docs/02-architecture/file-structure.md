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
│   ├── supabase/              ← Supabase client setup (browser + server + middleware)
│   ├── profile/               ← Profile data fetching + server actions
│   ├── company/               ← Company data fetching + server actions
│   ├── admin/                 ← Admin read queries + admin server actions (with audit log)
│   ├── notifications/         ← Notification insert/fetch/mark-read actions
│   ├── messages/              ← Conversation + message queries and mutations
│   └── storage/               ← File upload + CV signed URL utilities
│
├── types/                     ← TypeScript type definitions
├── hooks/                     ← Custom React hooks
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
| `lib/company/actions.ts` | All mutations: jobs, applications, assessments, saved jobs — wires 5 notification triggers |
| `lib/profile/profile_data.ts` | Profile read queries; handles missing `job_seeker_profiles` gracefully |
| `lib/profile/actions.ts` | Profile mutations: upsert profile, projects, badges, skills, avatar/CV |
| `lib/notifications/actions.ts` | `insertNotification` (service role), `getNotifications`, `markAllNotificationsRead` |
| `lib/messages/actions.ts` | `getOrCreateConversation`, conversation fetchers, `sendMessage`, `markConversationRead`, `getUnreadMessageCount` |
| `lib/admin/data.ts` | Admin read queries: live stats, all jobs/companies/users/reports, audit log |
| `lib/admin/actions.ts` | Admin server actions — all auto-write to `admin_audit_logs` |
| `components/app/MessagesClient.tsx` | Shared two-panel chat UI used by both job-seeker and company message pages |
| `components/app/AdminSidebar.tsx` | Admin sidebar navigation |
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

## Cleaned-Up Dead Code (Sprint 1)

All development artifacts and orphaned files were removed in Sprint 1. Nothing here is live any more:

| Path | Action |
|---|---|
| `src/app/stitch-html/` | ✅ Deleted — archived HTML mockups from Stitch |
| `src/dummy/` | ✅ Deleted — old component playground |
| `src/app/marketing/` | ✅ Deleted — duplicate route (real landing at `(marketing)/`) |
| `src/app/Company/` | ✅ Deleted — orphaned capital-C duplicate |
| `src/app/Administrator/` | ✅ Deleted — orphaned folder |
| `data/jobs.ts` | ✅ Deleted — static mock data, never wired to the app |
| `components/app-sidebar.tsx` (root) | ✅ Deleted — duplicate of `components/app/AppSidebar.tsx` |
| `components/TopBar.tsx`, `components/sidebar.tsx` (root) | ✅ Deleted — orphaned components |
