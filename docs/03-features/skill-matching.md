# Feature: Skill-Based Job Matching

**Status:** Done  
**Spec:** [`docs/07-specs/skill-matching.md`](../07-specs/skill-matching.md)

---

## What Was Built

### Database
- `skills` table: master list of skills (`id`, `name`)
- `job_to_skills` junction table: links jobs to required skills
- `profile_to_skills` junction table: links job seekers to their skills

### Job Creation / Editing
- `SkillPicker` component (`components/app/SkillPicker.tsx`): toggleable skill chips that serialize selection to a hidden `skill_ids` JSON input
- `createJob` and `updateJob` server actions parse `skill_ids` and write to `job_to_skills` (update uses delete-then-reinsert for clean replacement)
- Company job forms (`NewJobForm`, `EditJobForm`) include `SkillPicker` pre-populated with existing skill IDs

### Match Calculation
- `getActiveJobsWithSkills(userSkillIds)` in `lib/company/data.ts`:
  - Fetches active jobs with their required skills via `job_to_skills`
  - For each job: `matchCount` = intersection of job skill IDs and user skill IDs; `matchTotal` = total required skills
  - Returns `JobWithSkillsAndMatch[]` sorted by match ratio descending

### Job Feed Display
- `MatchBadge` on each card: "Strong Match" (ratio ≥ 70%), "Partial Match" (40–69%), nothing below 40%
- Up to 4 required skill tags shown per card (+N more if more)
- "Best Match" filter tab: shows only jobs where `matchCount > 0`
- User's skill IDs fetched server-side in `home/page.tsx` from `profile_to_skills`

---

## Key Files

| File | Role |
|---|---|
| `src/app/job-seeker/home/page.tsx` | Fetches user skill IDs + calls `getActiveJobsWithSkills` |
| `src/app/job-seeker/home/JobSeekerHomeClient.tsx` | `MatchBadge`, skill tags, "Best Match" filter |
| `components/app/SkillPicker.tsx` | Skill selection UI for job forms |
| `src/app/company/jobs/new/NewJobForm.tsx` | Job creation form with SkillPicker |
| `src/app/company/jobs/[jobId]/EditJobForm.tsx` | Job edit form with SkillPicker |
| `lib/company/data.ts` → `getActiveJobsWithSkills`, `getAllSkills`, `getJobSkillIds` | Read queries |
| `lib/company/actions.ts` → `createJob`, `updateJob` | Write skill associations to `job_to_skills` |
