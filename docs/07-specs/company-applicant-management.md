# Spec: Company Applicant Management

**Priority:** Highest — next feature to implement  
**Status:** Spec confirmed — ready for implementation  
**Source:** Confirmed by user.

---

## Goal

Give companies a complete workflow to manage applicants for their job postings:
view applicants, open their profile, access their CV securely, update their application status,
and (eventually) send them assessments.

---

## Scope of This Spec

This spec covers:
1. Applicant list view per job (review/improve existing page)
2. Individual applicant view (profile + CV + status)
3. Status update workflow (pending → reviewed → accepted/rejected)

Sending assessments is a separate spec (see `docs/07-specs/assessments.md`).

---

## User Stories Covered

- AM1: View all applicants for a specific job
- AM2: Open an applicant's full profile
- AM3: View applicant's CV securely (signed URL)
- AM4: Update applicant status

---

## Pages & Routes

### 1. Applicant List Page
**Route:** `company/jobs/[jobId]/applicants/page.tsx`  
**Already exists:** Yes — review and improve as needed.

Expected data per applicant row:
- Applicant name + avatar
- Applied at (date)
- Current status (badge)
- Link to individual applicant view

### 2. Individual Applicant Page
**Route:** `company/applicants/[applicationId]/page.tsx`  
**Already exists:** Yes — needs significant work.

Expected content:
- Applicant's name, avatar, bio, location
- Education (degree, institution)
- Skills list
- Projects list (name, description, skills, link)
- Badges/certifications
- Cover letter (if submitted — verify if stored)
- CV download button → generates a signed URL (60-minute expiry)
- Application status badge
- Status update control (dropdown or buttons: Reviewed / Accepted / Rejected)

### 3. Status Update Action
**File:** `lib/company/actions.ts` (new server action)  
**Action:** `updateApplicationStatus(applicationId: string, status: ApplicationStatus)`

```typescript
// Actual DB enum (from generated types)
type ApplicationStatus =
  | 'applied'
  | 'under_review'
  | 'assessment_sent'
  | 'assessment_completed'
  | 'shortlisted'
  | 'rejected'
```

> Note: `updateApplicationStatus` server action **already exists** in `lib/company/actions.ts`
> but is missing the authorization check. It needs to verify the calling user's company owns
> the job before updating. Add that check — do not replace the action, just fix it.

**Allowed transitions (middle-ground — confirmed by user):**

| From | To | Allowed |
|---|---|---|
| `applied` | `under_review` | Yes |
| `under_review` | `applied` | Yes |
| `under_review` | `shortlisted` | Yes |
| `under_review` | `rejected` | Yes |
| `shortlisted` | `under_review` | Yes |
| `rejected` | `under_review` | Yes |
| `assessment_sent` | `under_review` | Yes — company changes mind |
| `shortlisted` | `applied` | **No** — too drastic |
| `rejected` | `applied` | **No** — too drastic |

Note: `assessment_sent` and `assessment_completed` are set automatically by the assessment
flow — the company does not set these manually.

The server action must validate the transition before applying it.
If the transition is not allowed, return an error without updating.

- Verifies calling user owns the company that posted this job (authorization check)
- Validates the transition is allowed per the rules above
- Updates `job_applications.status`
- Calls `revalidatePath()` on both the applicant page and the applicant list

---

## CV Access (Signed URL)

When the company views the applicant page:
1. Server component calls `createSignedUrl('cvs', cv_path, 3600)` via the Supabase server client
2. Returns a time-limited URL
3. Rendered as a "Download CV" button/link
4. URL is NOT stored — generated fresh each page load

Authorization: only generate the signed URL if the current user's company posted the job that this application is for.

See `docs/07-specs/cv-signed-urls.md` for the full CV security spec.

---

## Data to Fetch

The applicant view requires a composite query. Proposed function in `lib/company/data.ts`:

```typescript
getApplicationWithApplicantProfile(applicationId: string): Promise<{
  application: JobApplication,
  applicant: Profile,
  projects: Project[],
  badges: Badge[],
  skills: string[],
  company_owns_application: boolean,
}>
```

---

## UI Components Needed

| Component | Notes |
|---|---|
| Status badge | Color-coded: gray=pending, blue=reviewed, green=accepted, red=rejected |
| Status update control | Dropdown or segmented buttons; calls server action on change |
| CV download button | Renders only if signed URL generated successfully |
| Applicant profile card | Reuses or adapts existing profile UI components |

---

## Authorization Rules

| Action | Who can do it |
|---|---|
| View applicant list | Company that owns the job |
| View individual applicant | Company that owns the job |
| Generate CV signed URL | Company that owns the job |
| Update application status | Company that owns the job |

If `company_owns_application` is false, return 404 or redirect to `/company/home`.

---

## Implementation Order

1. Write and test `updateApplicationStatus` server action
2. Write `getApplicationWithApplicantProfile` data function
3. Implement signed URL generation in the applicant page server component
4. Build/improve the applicant detail page UI
5. Add status update control to the page
6. Review and improve the applicant list page
7. Test full flow end-to-end

---

## Resolved Questions

1. **Cover letter** — stored in `job_applications`. ✓ Confirmed.
2. **CV URL format** — `cv_url` in `profiles` stores the full public URL (e.g. `https://....supabase.co/storage/v1/object/public/cvs/{userId}/cv.pdf`). The storage path to extract for signed URL generation is `{userId}/cv.{ext}`. The fix (store path only, generate signed URL at read time) is covered in `docs/07-specs/cv-signed-urls.md`.
3. **Status reversibility** — middle-ground transitions. See allowed transitions table above. ✓ Confirmed.
