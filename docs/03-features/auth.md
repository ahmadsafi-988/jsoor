# Feature: Authentication

**Status:** Done  
**Source:** Inferred from codebase.

---

## What's Implemented

- Email/password signup via Supabase Auth
- **Email confirmation required** — user receives a verification email after signup; account is not active until the link is clicked
- After confirmation: redirect to `/<role>/onboarding` (job seeker or company, based on signup role)
- Login with email/password
- Forgot password → email link → update password form
- Logout button (clears session)
- Middleware on every request:
  - No session → redirect to `/auth/login`
  - Unconfirmed user → no session issued by Supabase → blocked at login automatically
  - No profile → redirect to onboarding

---

## Email Confirmation Flow

```
User fills in signup form (email, password, role)
  → Server action calls supabase.auth.signUp with emailRedirectTo
  → Supabase sends confirmation email
  → User redirected to /auth/sign-up-success ("check your email")
  → User clicks link in email
  → /auth/confirm/route.ts exchanges token for session
  → User redirected to /<role>/onboarding
```

**Key files:**
- `lib/profile/actions.ts` → `signUp()` — job seeker signup, redirectTo = `/job-seeker/onboarding`
- `lib/company/actions.ts` → `signUpAsCompany()` — company signup, redirectTo = `/company/onboarding`
- `src/app/auth/confirm/route.ts` — handles both PKCE (`code`) and OTP (`token_hash` + `type`) confirmation flows
- `src/app/auth/sign-up-success/page.tsx` — "check your email" page

---

## Role System

A user's role (`job_seeker` or `company`) is stored in the `profiles` table.
It is set during onboarding, not at signup.

After login, the middleware reads the role and redirects to:
- `/job-seeker/home` for job seekers
- `/company/home` for companies
- `/admin` for admins

---

## Environment Variables Required

| Variable | Value (local) | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key | |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Used in `emailRedirectTo`; update to production URL on deploy |

---

## Supabase Dashboard Settings

| Setting | Value |
|---|---|
| `Authentication → Providers → Email → Enable email confirmations` | ON |
| `Authentication → URL Configuration → Site URL` | `http://localhost:3000` (update on deploy) |

---

## Files

| File | Purpose |
|---|---|
| `src/app/auth/login/page.tsx` | Login page |
| `src/app/auth/sign-up/page.tsx` | Sign-up page |
| `src/app/auth/sign-up-success/page.tsx` | "Check your email" page shown after signup |
| `src/app/auth/forgot-password/page.tsx` | Password recovery entry |
| `src/app/auth/update-password/page.tsx` | Password update form |
| `src/app/auth/confirm/route.ts` | Email confirmation token exchange handler |
| `src/app/auth/error/page.tsx` | Auth error display |
| `components/supabase/login-form.tsx` | Login form — redirects by role on success |
| `components/supabase/sign-up-form.tsx` | Sign-up form — role selector + calls signUp/signUpAsCompany |
| `components/supabase/forgot-password-form.tsx` | Forgot password form |
| `components/supabase/update-password-form.tsx` | Password update form |
| `components/supabase/logout-button.tsx` | Sign-out button |
| `src/middleware.ts` | Route protection + session refresh |
| `lib/supabase/middleware.ts` | Middleware Supabase client logic |

---

## Known Gaps

- No OAuth (Google, GitHub) — email/password only
- No profile deletion / account deactivation
