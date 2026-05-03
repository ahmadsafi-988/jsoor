# 06 — System Architecture

> Last updated: 2026-05-03

---

## High-Level Overview

```
Browser
  │
  ├── Next.js App (port 3000)
  │     ├── Middleware (Supabase session + role guards)
  │     ├── App Router (src/app/)
  │     │     ├── Server Components (data fetching)
  │     │     ├── Client Components ("use client" — interactivity)
  │     │     └── Server Actions ("use server" — mutations)
  │     └── API Route (/api/ai → OpenAI)
  │
  └── Supabase Platform
        ├── PostgreSQL (data)
        ├── Auth (email/password)
        ├── Storage (avatars, CVs)
        └── Edge Functions (email-notification)
```

---

## Next.js App Router Structure

```
src/
  app/
    layout.tsx                    Root layout (no providers)
    globals.css                   Global styles
    (marketing)/
      page.tsx                    Landing page
    auth/
      login/page.tsx
      sign-up/page.tsx
      forgot-password/page.tsx
      update-password/page.tsx
      confirm/route.ts            Email confirmation callback
      sign-up-success/page.tsx
      error/page.tsx
    job-seeker/
      layout.tsx                  AppSidebar + AppTopBar wrapper
      onboarding/page.tsx         4-step wizard
      home/
        page.tsx                  Server: fetches jobs + user skills
        JobSeekerHomeClient.tsx   Client: filter/search/apply UI
      profile/
        [username]/
          page.tsx                Server: fetches profile data
          edit/page.tsx
      job-applications/
        page.tsx
        JobApplicationsClient.tsx
      assessments/
        page.tsx
        AssessmentsClient.tsx     Client: assessment taker
      saved-jobs/
        page.tsx
        SavedJobsClient.tsx
      interview-simulator/
        page.tsx                  Client: OpenAI simulator
      messages/page.tsx           Client: UI-only (no backend)
      notifications/page.tsx      Client: UI-only (no backend)
    company/
      layout.tsx                  CompanySidebar + CompanyTopBar wrapper
      onboarding/page.tsx
      home/page.tsx               Server: company dashboard
      jobs/
        page.tsx
        new/page.tsx + NewJobForm.tsx
        [jobId]/
          page.tsx + EditJobForm.tsx
          applicants/page.tsx
      applicants/
        [applicationId]/
          page.tsx                Server: fetch + guard
          ApplicantDetailClient.tsx  Client: status management
      assessments/page.tsx
      profile/page.tsx
    admin/
      page.tsx                    Stub
    api/
      ai/route.ts                 POST → OpenAI GPT-4o-mini
  middleware.ts                   Session refresh + role redirect
```

---

## Data Flow Patterns

### Server Component → Client Component (Primary Pattern)

```
page.tsx (Server)
  ├── Calls lib/company/data.ts functions (server-side Supabase)
  ├── Fetches all initial data
  └── Passes as props to *Client.tsx component

*Client.tsx (Client)
  ├── Receives initialData props
  ├── Manages local state (filter, search, optimistic updates)
  └── Calls Server Actions for mutations
```

**Example:** `job-seeker/home/page.tsx` fetches jobs server-side, passes to `JobSeekerHomeClient.tsx` which handles UI state.

### Server Actions (Mutations)

All mutations go through `lib/company/actions.ts` or `lib/profile/actions.ts`:
```
Client Component
  └── calls serverAction(formData)
        └── creates Supabase server client
        └── validates auth
        └── writes to DB
        └── calls revalidatePath()
        └── returns { success } or { error }
```

### API Route (OpenAI)

```
/job-seeker/interview-simulator/page.tsx (Client)
  └── POST /api/ai { action, config/questions/answers }
        └── api/ai/route.ts
              └── callOpenAI() → OpenAI API
              └── returns questions[] or { feedback[], overallSummary }
```

---

## Supabase Client Split

| File | Used Where | Purpose |
|---|---|---|
| `lib/supabase/server.ts` | Server Components, Server Actions | Full auth session access |
| `lib/supabase/client.ts` | Client Components | Browser-side, anon key |
| `lib/supabase/middleware.ts` | `src/middleware.ts` | Session refresh on each request |

**Critical rule:** Never use the server client in a global variable. Always create a new one per request (Fluid Compute compatibility).

---

## Storage Architecture

### Buckets
- `avatars` — user avatars and company logos (public bucket → public URLs)
- `cvs` — job seeker CVs (private bucket → signed URLs only)
- `message-attachments` — files sent via messaging (private bucket → signed URLs only) **[to be created]**

### CV Security
- CVs are stored under path `{userId}/cv.pdf`
- `cv_url` in DB stores the storage path, not a URL
- At read time, `lib/storage/cv.ts` calls `createSignedUrl()` server-side
- Signed URL expires (typically 1 hour) — prevents persistent public access

---

## Email Notifications (Edge Function)

```
Supabase DB trigger (on job_applications UPDATE)
  └── calls email-notification edge function
        └── reads STATUS_COPY for template text
        └── sends email via Supabase (or Resend/SMTP — check config)
```

Statuses that trigger email: `reviewed`, `shortlisted`, `accepted`, `rejected`.

---

## Authentication Flow

### Job Seeker Sign-Up
```
/auth/sign-up → supabase.auth.signUp()
  → email confirmation sent
  → user clicks link → /auth/confirm?next=/job-seeker/onboarding
  → /auth/confirm/route.ts exchanges code for session
  → redirect to /job-seeker/onboarding
  → onboarding wizard → upsertProfile() → set role job_seeker
  → redirect to /job-seeker/profile/[username]
```

### Company Sign-Up
```
/auth/sign-up (company variant) → supabase.auth.signUp({ data: { role: 'company' } })
  → email confirmation → /auth/confirm?next=/company/onboarding
  → company onboarding → upsertCompany() → set role company
  → redirect to /company/home
```

---

## Component Architecture

### App-Level Components (Shared)
```
components/
  app/
    AppSidebar.tsx          Job seeker sidebar navigation
    AppTopBar.tsx           Job seeker top bar
    CompanySidebar.tsx      Company sidebar navigation
    CompanyTopBar.tsx       Company top bar
    SkillPicker.tsx         Reusable skill selector
  supabase/
    login-form.tsx
    sign-up-form.tsx
    logout-button.tsx
    forgot-password-form.tsx
    update-password-form.tsx
  landing/
    Hero.tsx, Features.tsx, Pricing.tsx, etc.
  ui/                       All shadcn/ui components
```

### Type System
```
lib/
  supabase_generated_types.ts    Auto-generated from Supabase schema
  global_types.ts                Derived types (user, FullJobSeekerProfile, etc.)
  company/data.ts                Query result types + data fetchers
```

---

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Server Components + Server Actions | No separate API layer needed for most features |
| Single DB write on onboarding finish | Prevents partial profile state between wizard steps |
| Signed URLs for CVs (not public) | Privacy — CVs not guessable by URL |
| Status state machine in `ALLOWED_TRANSITIONS` | Prevents illegal status jumps without DB constraints |
| `applicant_id` FK to `auth.users` | Legacy decision; requires split queries but matches Supabase pattern |
| Server-side skill match calculation | Match ratio calculated at fetch time, sorted before client |
