# Feature: Company Applicant Management

**Status:** Done  
**Spec:** [`docs/07-specs/company-applicant-management.md`](../07-specs/company-applicant-management.md)

---

## What Was Built

### Applicant Detail Page (`company/applicants/[applicationId]`)
- Server component fetches full applicant profile in two steps (application + job, then profile + projects + skills + badges in parallel)
- Auth guard: company must own the job the application belongs to (`company_owns_application` check)
- Signed CV URL generated server-side via `lib/storage/cv.ts` — raw storage path never sent to client
- Passes all data to `ApplicantDetailClient` for interactive rendering

### ApplicantDetailClient
- Renders applicant's full profile: name, degree, location, bio, skills, projects (with skill tags), badges, cover letter
- Status dropdown showing only valid next transitions (mirrors server-side `ALLOWED_TRANSITIONS`)
- Inline assessment form: company fills title, description, deadline, questions, submits
- Assessment results view: shows submitted answers once applicant submits

### Applicant List (`company/jobs/[jobId]/applicants`)
- URL-based status filter (`?status=`) with count badge per status tab
- Auth guard: `notFound()` if job doesn't belong to the requesting company

### Status Workflow (`lib/company/actions.ts`)
- `updateApplicationStatus`: fetches application + job, verifies `company_id === user.id`, validates transition via `ALLOWED_TRANSITIONS`, revalidates both the list and detail paths
- Allowed transitions:
  - `pending` → `reviewed`, `rejected`
  - `reviewed` → `shortlisted`, `rejected`
  - `shortlisted` → `accepted`, `rejected`
  - `rejected` → `reviewed` (reconsider)

---

## Key Files

| File | Role |
|---|---|
| `src/app/company/applicants/[applicationId]/page.tsx` | Server component: data fetch + auth guard + signed CV URL |
| `src/app/company/applicants/[applicationId]/ApplicantDetailClient.tsx` | Client: status dropdown, assessment form, results view |
| `src/app/company/jobs/[jobId]/applicants/page.tsx` | Applicant list with status filter |
| `lib/company/data.ts` → `getApplicationWithApplicantProfile` | Two-step fetch returning full profile + `company_owns_application` flag |
| `lib/company/actions.ts` → `updateApplicationStatus` | Server action with ownership + transition validation |
| `lib/storage/cv.ts` → `getCvSignedUrl` | Converts stored path to 1-hour signed URL |
