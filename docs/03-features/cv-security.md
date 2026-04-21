# Feature: CV Security (Signed URLs)

**Status:** Known issue — planned fix  
**Source:** Confirmed by user.

---

## Problem

CVs are stored in the `cvs` Supabase Storage bucket, which is set to **private**.
However, the upload code (`lib/storage/upload.ts`) currently returns a **public URL** instead of a signed URL.

This means:
- Anyone with the URL can access a candidate's CV
- The private bucket setting has no effect
- This is a security vulnerability

## Intended Behavior

- CVs must only be accessible via **signed URLs**
- Signed URLs should expire after a short window (e.g. 60 minutes)
- Only authorized users should be able to generate a signed URL:
  - The job seeker who owns the CV
  - Companies viewing an application from that job seeker
- The public URL path for CVs must **never** be exposed

## Files Involved

| File | Issue |
|---|---|
| `lib/storage/upload.ts` | Returns public URL; signed URL logic is commented out (lines ~63–67) |
| `company/applicants/[applicationId]/page.tsx` | Will need to generate signed URL to display CV link |

## Spec

See [`docs/07-specs/cv-signed-urls.md`](../07-specs/cv-signed-urls.md) — to be written.
