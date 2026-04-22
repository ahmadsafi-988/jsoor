# Spec: Assessments

**Priority:** 3  
**Status:** Spec confirmed — ready for implementation  
**Source:** Confirmed by user.

---

## What Already Exists

The assessment feature is largely built. Do not rebuild what works.

### Database
- `assessments` table: `company_id`, `application_id`, `title`, `description`, `deadline`, `questions` (jsonb), `submission` (jsonb), `score`, `feedback`, `status` (`pending | submitted | reviewed`)

### Server Actions (`lib/company/actions.ts`)
- `sendAssessment` — company creates and sends an assessment to an applicant
- `submitAssessment` — job seeker submits answers
- `reviewAssessment` — company scores and gives feedback

### Data Functions (`lib/company/data.ts`)
- `getCompanyAssessments` — all assessments sent by the logged-in company
- `getAssessmentForApplication` — assessment for a specific application
- `getMyAssessments` — assessments assigned to the logged-in job seeker

### Pages (already working)
- `company/assessments/page.tsx` — company overview: stats + list with link to applicant page
- `company/applicants/[applicationId]/` — send assessment form + review submission
- `job-seeker/assessments/page.tsx` — job seeker view + submit form

---

## Gaps to Fix

### Gap 1 — Missing authorization in `submitAssessment` (critical)

**File:** `lib/company/actions.ts`  
**Problem:** `submitAssessment` does not verify the calling user is the applicant for this assessment. Any authenticated user who knows an `assessment_id` can submit answers.

**Fix:** After fetching the assessment row, fetch its application and check `applicant_id === user.id`. Return an error if the check fails.

```typescript
// After fetching the assessment:
const { data: application } = await supabase
  .from("job_applications")
  .select("applicant_id")
  .eq("id", assessment.application_id)
  .single();

if (!application || application.applicant_id !== user.id) {
  return { error: "Not authorized." };
}
```

### Gap 2 — Job seeker assessments page does client-side fetching

**File:** `src/app/job-seeker/assessments/page.tsx`  
**Problem:** The page is a `"use client"` component that fetches directly from Supabase in a `useEffect`. The server-side `getMyAssessments` function in `lib/company/data.ts` already exists and should be used instead.

**Fix:** Convert to a server component + client component split:
- Server component: calls `getMyAssessments`, passes data as props
- Client component (`AssessmentsClient.tsx`): handles the expand/collapse and submit interactions

---

## Implementation Order

1. Fix `submitAssessment` authorization check
2. Convert job seeker assessments page to server component

---

## Out of Scope for This Spec

- AI grading of assessments (post-MVP)
- Notifications when an assessment is sent/submitted (separate spec)
