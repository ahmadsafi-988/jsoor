# Spec: Saved Jobs

**Priority:** 4  
**Status:** Spec confirmed — ready for implementation  
**Source:** Confirmed by user.

---

## Goal

Let job seekers bookmark jobs they're interested in and view them later on a dedicated page.

---

## What Already Exists

- Bookmark button (`Bookmark` icon) is already rendered on each job card in `job-seeker/home/page.tsx`
- It currently toggles a local `saved` state only — nothing is persisted

---

## Database

New table: `saved_jobs`

```sql
create table saved_jobs (
  user_id uuid not null references profiles(id) on delete cascade,
  job_id  uuid not null references jobs(id)     on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

alter table saved_jobs enable row level security;

create policy "Job seekers manage their own saved jobs"
  on saved_jobs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Composite primary key on `(user_id, job_id)` means the same job can't be saved twice.

---

## Server Actions (`lib/company/actions.ts`)

```typescript
saveJob(jobId: string)   // inserts row — ignores duplicate (upsert)
unsaveJob(jobId: string) // deletes row
```

Both revalidate `/job-seeker/saved-jobs`.

---

## Data Functions (`lib/company/data.ts`)

```typescript
getSavedJobs(): Promise<(JobRow & { company: Pick<CompanyRow, "name" | "logo_url"> | null })[]>
getSavedJobIds(): Promise<string[]>  // used to hydrate bookmark state on the home page
```

---

## Pages & Routes

### 1. Saved Jobs Page
**Route:** `job-seeker/saved-jobs/page.tsx`  
**New page** — server component.

Shows all saved jobs as cards (same card layout as the home page).  
Each card has an "Unsave" button and an "Apply" button.  
Empty state: "No saved jobs yet. Browse jobs and click the bookmark icon to save them."

### 2. Home Page — wire up the bookmark button
**File:** `src/app/job-seeker/home/page.tsx`

- On page load, fetch `getSavedJobIds()` server-side and pass the set of saved IDs as a prop
- When the user clicks the bookmark icon: call `saveJob` or `unsaveJob` server action
- Optimistically flip the icon immediately; revert on error

---

## Generated Types

After the migration, run `generate_typescript_types` and update `lib/supabase_generated_types.ts`.

---

## Implementation Order

1. Write and apply the DB migration
2. Regenerate TypeScript types
3. Add `saveJob` / `unsaveJob` server actions
4. Add `getSavedJobs` / `getSavedJobIds` data functions
5. Build the saved jobs page
6. Wire up the bookmark button on the home page
