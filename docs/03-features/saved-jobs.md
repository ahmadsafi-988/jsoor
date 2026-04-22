# Feature: Saved / Bookmarked Jobs

**Status:** Done  
**Spec:** [`docs/07-specs/saved-jobs.md`](../07-specs/saved-jobs.md)

---

## What Was Built

### Database
- `saved_jobs` table: `user_id`, `job_id`, `saved_at`

### Job Feed (Home Page)
- Bookmark icon on each job card — filled when saved, outline when not
- `saveJob` and `unsaveJob` server actions; optimistic toggle on click
- Saved state initialized server-side: `getSavedJobIds()` fetched in `home/page.tsx`

### Saved Jobs Page (`job-seeker/saved-jobs`)
- Server component fetches `getSavedJobs()` (full job data) + `getMyApplications()` in parallel
- `SavedJobsClient.tsx`: unsaving a job removes it from the list optimistically; inline apply form same as home page
- Accessible from the sidebar ("Saved Jobs" with Bookmark icon, between "My Applications" and "Assessments")

---

## Key Files

| File | Role |
|---|---|
| `src/app/job-seeker/saved-jobs/page.tsx` | Server component: data fetch |
| `src/app/job-seeker/saved-jobs/SavedJobsClient.tsx` | Client: unsave + inline apply |
| `src/app/job-seeker/home/JobSeekerHomeClient.tsx` | Bookmark button on job cards |
| `lib/company/data.ts` → `getSavedJobIds`, `getSavedJobs` | Read queries |
| `lib/company/actions.ts` → `saveJob`, `unsaveJob` | Server actions (upsert / delete) |
| `components/app/AppSidebar.tsx` | Added "Saved Jobs" nav item |
