# Spec: Email Notifications

**Priority:** 6  
**Status:** Spec written — awaiting confirmation  
**Source:** Confirmed by user.

---

## Goal

Notify job seekers by email when a company changes the status of their application. The email should feel personal and informative — telling the user exactly which job and company, and what the new status means.

---

## What Already Exists

- `job_applications.status` is updated by `updateApplicationStatus` server action in `lib/company/actions.ts`
- Job seeker's email is stored in `auth.users` (Supabase Auth)
- No notification system of any kind exists yet

---

## Approach

```
Company updates application status
  → Supabase Database Webhook fires on job_applications UPDATE
  → Calls a Supabase Edge Function (email-notification)
  → Edge Function fetches applicant email + job title + company name
  → Sends email via Resend API
```

We use **Resend** (resend.com) as the email provider — it has a generous free tier (3,000 emails/month) and has official Supabase integration docs.

---

## Email Content

**Trigger:** `job_applications.status` changes to any of: `reviewed`, `shortlisted`, `accepted`, `rejected`

**Subject line examples:**
- `Your application at Acme Corp has been updated`

**Body:**
```
Hi [First Name],

Your application for [Job Title] at [Company Name] has been updated.

New status: Shortlisted 🎉

Log in to your Jsoor account to view your application.

— The Jsoor Team
```

**Status messages:**
| Status | Message shown in email |
|---|---|
| `reviewed` | Your application is being reviewed by the company. |
| `shortlisted` | Great news — you've been shortlisted! |
| `accepted` | Congratulations — your application has been accepted! |
| `rejected` | Unfortunately, your application was not selected this time. |

Do **not** send an email when status changes back to `reviewed` from `rejected` (reconsider case) — that would be confusing.

---

## Database Webhook

Configure in Supabase Dashboard → Database → Webhooks:

| Setting | Value |
|---|---|
| Name | `on_application_status_change` |
| Table | `job_applications` |
| Events | `UPDATE` |
| URL | `{SUPABASE_FUNCTIONS_URL}/email-notification` |
| HTTP Headers | `Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}` |

---

## Edge Function

**Path:** `supabase/functions/email-notification/index.ts`

**Logic:**
1. Parse the webhook payload — extract `record` (new row) and `old_record` (old row)
2. If `record.status === old_record.status` → return early (no change)
3. If `record.status === 'pending'` → return early (no email on creation)
4. Fetch applicant's first name + email from `auth.users` + `profiles` using `application_id → applicant_id`
5. Fetch job title from `jobs` using `record.job_id`
6. Fetch company name from `companies` using `jobs.company_id`
7. Call Resend API to send the email

**Environment variables needed:**
- `RESEND_API_KEY` — from Resend dashboard
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — already available in Edge Functions by default

---

## Edge Function Code Outline

```typescript
// supabase/functions/email-notification/index.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

const SKIP_STATUSES = new Set(["pending"]);
const STATUS_MESSAGES: Record<string, string> = {
  reviewed:   "Your application is being reviewed by the company.",
  shortlisted: "Great news — you've been shortlisted!",
  accepted:   "Congratulations — your application has been accepted!",
  rejected:   "Unfortunately, your application was not selected this time.",
};

Deno.serve(async (req) => {
  const payload = await req.json();
  const { record, old_record } = payload;

  if (record.status === old_record.status) return ok();
  if (SKIP_STATUSES.has(record.status)) return ok();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch applicant email + name
  // Fetch job title + company name
  // Send via Resend

  return ok();
});

function ok() {
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
```

---

## Files to Create / Change

| File | Change |
|---|---|
| `supabase/functions/email-notification/index.ts` | New Edge Function |
| Supabase Dashboard → Webhooks | New webhook (manual step, not code) |
| `.env.local` | Add `RESEND_API_KEY` |

No changes to any existing Next.js code — this is entirely on the Supabase side.

---

## Implementation Order

1. Sign up for Resend, get API key, verify a sender domain (or use their sandbox)
2. Create the Edge Function locally (`supabase functions new email-notification`)
3. Implement and test locally with `supabase functions serve`
4. Deploy the function (`supabase functions deploy email-notification`)
5. Configure the Database Webhook in the Supabase dashboard
6. Test end-to-end: change an application status → check inbox

---

## Open Questions

1. **Sender address** — what email address should the emails come from? (e.g. `no-reply@jsoor.com` or a Resend sandbox address for now)
2. **Resend domain** — do we have a custom domain, or should we use Resend's sandbox for demo purposes?
