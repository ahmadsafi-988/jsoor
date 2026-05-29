# Spec: Skill Matching

**Priority:** 5  
**Status:** Spec confirmed — ready for implementation  
**Source:** Confirmed by user.

---

## Goal

Surface relevant jobs to job seekers based on overlap between their skills and the skills a job requires. Companies tag their jobs with required skills; job seekers see a match score on each card.

---

## Database

New table: `job_to_skills`

```sql
create table job_to_skills (
  id       bigint generated always as identity primary key,
  job_id   uuid not null references jobs(id)   on delete cascade,
  skill_id int  not null references skills(id) on delete cascade,
  unique (job_id, skill_id)
);

alter table job_to_skills enable row level security;

-- Anyone can read job skills (needed for matching on job seeker home)
create policy "Public read job skills"
  on job_to_skills for select using (true);

-- Only the company that owns the job can manage its skills
create policy "Company manages job skills"
  on job_to_skills for all
  using  (exists (select 1 from jobs where jobs.id = job_id and jobs.company_id = auth.uid()))
  with check (exists (select 1 from jobs where jobs.id = job_id and jobs.company_id = auth.uid()));
```

---

## Company Side — Skill Tagging

### Job creation / editing form
**Files:** `src/app/company/jobs/new/page.tsx`, `src/app/company/jobs/[jobId]/page.tsx`

Add a multi-select skill picker to both forms. On submit, the selected skill IDs are passed alongside the job fields.

### Server actions (`lib/company/actions.ts`)

`createJob` and `updateJob` need to accept `skillIds: number[]` and sync `job_to_skills` rows after upserting the job:

```typescript
// After inserting/updating the job:
// 1. Delete existing job_to_skills rows for this job
// 2. Insert new rows for each skillId
```

---

## Job Seeker Side — Match Score

### Data function (`lib/company/data.ts`)

New function `getActiveJobsWithSkills`:

```typescript
type JobWithSkillsAndMatch = JobWithCompany & {
  requiredSkills: string[];   // skill names for display
  matchCount: number;         // how many required skills the user has
  matchTotal: number;         // total required skills for the job
};

getActiveJobsWithSkills(userSkillIds: number[]): Promise<JobWithSkillsAndMatch[]>
```

Fetches active jobs with their skill tags, then for each job calculates overlap with the user's skills. Jobs are returned sorted by match score descending (highest overlap first), then by `created_at` descending as a tiebreaker.

### Home page

**File:** `src/app/job-seeker/home/page.tsx`

- Server component fetches user's `profile_to_skills` (skill IDs) alongside jobs
- Passes `userSkillIds` to `getActiveJobsWithSkills`
- `JobSeekerHomeClient` receives jobs with match data

### Job card changes

- Show required skill tags on each card (up to 4, then "+N more")
- If the job has required skills, show a match badge:
  - `≥ 70%` match → green "Strong Match"
  - `40–69%` → amber "Partial Match"  
  - `< 40%` or no skills → no badge
- Add a "Best Match" filter tab alongside "All", "Full-time", etc. (filters to jobs with ≥ 1 matching skill)

---

## Implementation Order

1. Apply DB migration (`job_to_skills`)
2. Regenerate TypeScript types
3. Add skill sync logic to `createJob` and `updateJob` actions
4. Add skill picker to job creation and edit forms
5. Write `getActiveJobsWithSkills` data function
6. Update home page server component to pass skill data
7. Update job card UI (skill tags + match badge)
