# Feature: Assessments

**Status:** Partial  
**Source:** Inferred from codebase + confirmed by user.

---

## What Exists

### Database
- `assessments` table with full schema:
  - `company_id`, `application_id` (links assessment to a specific applicant)
  - `title`, `description`, `deadline`
  - `status`: `pending | submitted | reviewed`
  - `questions` (jsonb), `submission` (jsonb)
  - `score`, `feedback`

### Job Seeker Side
- `job-seeker/assessments/page.tsx` — lists assessments assigned to the job seeker
- UI for viewing and submitting assessments exists

### Company Side
- `company/assessments/page.tsx` — assessment management page exists

## What's Missing

| Gap | Description |
|---|---|
| Send assessment to applicant | Company has no UI to create and assign an assessment to a specific application |
| Assessment results in DB | Scores/feedback are not being saved after submission |
| Company view results | Company cannot see what an applicant submitted or their score |

## Planned Behavior

1. Company views an applicant → clicks "Send Assessment"
2. Company fills in: title, description, deadline, questions
3. Assessment row created with `application_id` and `status = pending`
4. Job seeker sees assessment in their dashboard
5. Job seeker submits answers → `submission` stored, `status = submitted`
6. (Optional) AI grades the assessment → `score` and `feedback` stored, `status = reviewed`
7. Company can view results

## Spec

See [`docs/07-specs/assessments.md`](../07-specs/assessments.md) — to be written.
