# Feature: Company Applicant Management

**Status:** Partial — in progress, next priority  
**Source:** Confirmed by user + inferred from codebase.

---

## What Exists

- `company/jobs/[jobId]/applicants/page.tsx` — lists applicants for a job
- `company/applicants/[applicationId]/page.tsx` — individual application review page
- `job_applications` table with `status` field (`pending | reviewed | accepted | rejected`)
- `assessments` table with `application_id` FK

## What's Missing

| Gap | Description |
|---|---|
| Applicant status update | No UI or server action to change `job_applications.status` |
| Secure CV access | CVs stored with public URL; should use signed URL |
| Full applicant profile view | Company sees limited info; no link to full job seeker profile |
| Send assessment | No UI for company to create/send an assessment to an applicant |
| Assessment results view | Company cannot view submitted assessment results |

## Spec

See [`docs/07-specs/company-applicant-management.md`](../07-specs/company-applicant-management.md) for the full implementation spec.
