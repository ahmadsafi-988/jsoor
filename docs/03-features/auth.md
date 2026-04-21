# Feature: Authentication

**Status:** Done  
**Source:** Inferred from codebase.

---

## What's Implemented

- Email/password signup via Supabase Auth
- Email confirmation with redirect to `auth/confirm` route handler
- After confirmation: redirect to `/<role>/onboarding`
- Login with email/password
- Forgot password → email link → update password form
- Logout button (clears session)
- Middleware on every request:
  - No session → redirect to `/auth/login`
  - No profile → redirect to onboarding

## Role System

A user's role (`job_seeker` or `company`) is stored in the `profiles` table.
It is set during onboarding, not at signup.

After login, the middleware reads the role and redirects to:
- `/job-seeker/home` for job seekers
- `/company/home` for companies

## Files

| File | Purpose |
|---|---|
| `src/app/auth/login/page.tsx` | Login page |
| `src/app/auth/sign-up/page.tsx` | Sign-up page |
| `src/app/auth/forgot-password/page.tsx` | Password recovery entry |
| `src/app/auth/update-password/page.tsx` | Password update form |
| `src/app/auth/confirm/route.ts` | Email confirmation API handler |
| `src/app/auth/error/page.tsx` | Auth error display |
| `components/supabase/login-form.tsx` | Login form component |
| `components/supabase/sign-up-form.tsx` | Sign-up form component |
| `components/supabase/forgot-password-form.tsx` | Forgot password form |
| `components/supabase/update-password-form.tsx` | Password update form |
| `components/supabase/logout-button.tsx` | Sign-out button |
| `src/middleware.ts` | Route protection + session refresh |
| `lib/supabase/middleware.ts` | Middleware Supabase client logic |

## Known Gaps

- No OAuth (Google, GitHub) — email/password only
- No profile deletion / account deactivation
