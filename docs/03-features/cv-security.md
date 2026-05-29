# Feature: CV Security (Signed URLs)

**Status:** Done  
**Spec:** `docs/07-specs/cv-signed-urls.md`

---

## What Was Built

### Storage Strategy
- `lib/storage/upload.ts` → `uploadCV()` uploads to the private `cvs` bucket and returns the **storage path only** (e.g. `userId/cv.pdf`), never a public URL
- `lib/profile/actions.ts` → `updateCvUrl()` saves that path string to `job_seeker_profiles.cv_url`

### Read-Time Signed URL Generation
- `lib/storage/cv.ts` → `getCvSignedUrl(cvUrl, expiresIn?)`:
  - Handles **both** old full-URL format (for existing data) and new path-only format
  - Calls `supabase.storage.from("cvs").createSignedUrl(path, 3600)` (1 hour default)
  - Returns the signed URL or `null` if generation fails

### Where Signed URLs Are Used
| Location | How |
|---|---|
| `src/app/job-seeker/profile/[username]/page.tsx` | Server component calls `getCvSignedUrl`, passes to `DetailsCard`; raw path never sent to client |
| `src/app/company/applicants/[applicationId]/page.tsx` | Server component calls `getCvSignedUrl`, passes signed URL to `ApplicantDetailClient` |

### Edit Page
- `src/app/job-seeker/profile/[username]/edit/page.tsx` shows "CV uploaded ✓" text when a CV exists — no link, since this is a client component and cannot call the server-side helper

---

## Backward Compatibility
`getCvSignedUrl` detects the old full-URL format by looking for `/object/public/cvs/` in the string and extracts the path. New uploads always store path-only, so this fallback will become unnecessary over time.
