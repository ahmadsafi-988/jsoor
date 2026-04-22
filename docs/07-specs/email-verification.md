# Spec: Email Verification on Signup

**Priority:** 7  
**Status:** Implemented — enable via Supabase dashboard (see steps below)  
**Source:** Confirmed by user.

---

## Goal

Ensure that every user who signs up owns the email address they registered with. Supabase Auth has this built in — it just needs to be switched on and the app flow needs to handle the "unconfirmed" state gracefully.

---

## What Already Exists

- `src/app/auth/confirm/route.ts` — the confirmation callback route is already implemented. When Supabase sends a confirmation email, the link points here. The route exchanges the token for a session and redirects the user onward.
- `src/app/auth/sign-up-success/page.tsx` — a "check your email" page already exists and is shown after signup.
- Email confirmation is currently **disabled** in the Supabase dashboard (Auth → Settings → Email → "Enable email confirmations" is off).

---

## What Needs to Change

### 1. Supabase Dashboard (one toggle)
`Authentication → Providers → Email → Enable email confirmations → ON`

That alone makes Supabase send a confirmation email on every new signup and block unconfirmed users from logging in.

### 2. Confirmation Email Template (Supabase Dashboard)
`Authentication → Email Templates → Confirm signup`

Customize the template to match Jsoor's brand:

```
Subject: Confirm your Jsoor account

Hi there,

Thanks for signing up for Jsoor. Click the button below to confirm your email address.

[Confirm Email] → {{ .ConfirmationURL }}

If you didn't create an account, you can safely ignore this email.

— The Jsoor Team
```

The `{{ .ConfirmationURL }}` token points to our `src/app/auth/confirm/route.ts` handler automatically — no code change needed there.

### 3. Sign-up Form — handle the unconfirmed state
**File:** `components/supabase/sign-up-form.tsx`

Currently after signup the form redirects immediately. With email confirmation on, Supabase returns `{ user, session: null }` — there is no session yet.

The form should detect `session === null` after signup and redirect to `/auth/sign-up-success` instead of proceeding to onboarding.

```typescript
const { data, error } = await supabase.auth.signUp({ email, password });
if (error) { /* show error */ return; }

if (!data.session) {
  // Email confirmation required — user must check their inbox
  router.push("/auth/sign-up-success");
  return;
}

// Session exists (confirmation disabled or user already confirmed)
router.push(`/${role}/onboarding`);
```

### 4. Sign-up Success Page — make sure it's clear
**File:** `src/app/auth/sign-up-success/page.tsx`

The page should clearly tell the user:
- Check your inbox for a confirmation email
- Click the link in the email to activate your account
- The link expires after 24 hours (Supabase default)
- If they don't see it, check spam

No code changes needed if the page already says this — just verify the copy.

### 5. Middleware — guard unconfirmed users
**File:** `src/middleware.ts`

Supabase sets `user.email_confirmed_at` once the user clicks the link. If it's `null`, the user has signed up but not confirmed.

Add a check in the middleware: if the user is authenticated but `email_confirmed_at` is null and they're trying to access a protected route → redirect to `/auth/sign-up-success` with a message.

```typescript
const { data: { user } } = await supabase.auth.getUser();

if (user && !user.email_confirmed_at) {
  return NextResponse.redirect(new URL("/auth/sign-up-success", req.url));
}
```

---

## What Does NOT Need to Change

- `src/app/auth/confirm/route.ts` — already handles the token exchange correctly
- The rest of the auth flow (login, password reset) — unaffected
- RLS policies — unaffected
- Onboarding flow — unaffected (only reached after confirmation)

---

## Email Sender Configuration

By default Supabase sends from their shared SMTP server (`noreply@mail.supabase.io`). For production this should be changed to a custom domain.

Options:
- **Supabase custom SMTP** — plug in Resend, SendGrid, or any SMTP provider under `Authentication → SMTP Settings`
- **Recommended:** use Resend (same provider as the notification emails) for consistency

If using Resend for both notification emails and auth emails, only one Resend account and one sender domain is needed.

---

## Implementation Order

1. Set up custom SMTP in Supabase (Resend) so auth emails come from `no-reply@jsoor.com` not Supabase's domain
2. Customize the confirmation email template in the Supabase dashboard
3. Update `components/supabase/sign-up-form.tsx` to handle `session === null`
4. Add the `email_confirmed_at` guard to `src/middleware.ts`
5. Verify `src/app/auth/sign-up-success/page.tsx` copy is clear
6. Enable email confirmations in the Supabase dashboard
7. Test end-to-end: sign up → check inbox → click link → land on onboarding

**Enable the toggle last** — after all code changes are deployed — to avoid locking out users during the rollout.

---

## Open Questions

1. **Resend domain** — do we have a custom domain for Jsoor? If not, Resend's sandbox domain works for demo but emails may land in spam.
2. **Token expiry** — Supabase default is 24 hours. Is that acceptable or should it be shorter/longer?
3. **Existing unconfirmed users** — when this is turned on, any accounts created while confirmation was off will have `email_confirmed_at = null`. Should we bulk-confirm them via SQL or let them re-confirm?
