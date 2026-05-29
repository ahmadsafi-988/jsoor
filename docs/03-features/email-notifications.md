# Feature: Email Notifications (Application Status)

**Status:** Done — deploy + webhook setup required  
**Spec:** [`docs/07-specs/email-notifications.md`](../07-specs/email-notifications.md)

---

## What Was Built

### Edge Function
**File:** `supabase/functions/email-notification/index.ts`

Triggered by a Supabase Database Webhook whenever `job_applications` is updated. Sends a branded HTML email to the job seeker via Resend.

**Logic:**
1. Receives webhook payload with `record` (new row) + `old_record` (previous row)
2. Skips if status didn't change or status is `pending`
3. Fetches applicant name + email, job title, company name from DB
4. Sends email via Resend API with status-specific subject + body

**Status messages:**
| Status | Subject |
|---|---|
| `reviewed` | Your application is being reviewed |
| `shortlisted` | You've been shortlisted! 🎉 |
| `accepted` | Congratulations — you got the job! 🎊 |
| `rejected` | Update on your application |

---

## Deploy Steps

### 1. Install Supabase CLI
```bash
npm install -g supabase
supabase login
```

### 2. Link your project
```bash
supabase link --project-ref hmisspubbdfjrofycmgc
```

### 3. Set the Resend secret
```bash
supabase secrets set RESEND_API_KEY=your_resend_key_here
supabase secrets set NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Deploy the function
```bash
supabase functions deploy email-notification
```

### 5. Configure the Database Webhook (Supabase Dashboard)
`Database → Webhooks → Create new webhook`

| Setting | Value |
|---|---|
| Name | `on_application_status_change` |
| Table | `job_applications` |
| Events | `UPDATE` |
| Type | Supabase Edge Functions |
| Function | `email-notification` |

---

## Environment Variables Required

| Variable | Where |
|---|---|
| `RESEND_API_KEY` | Supabase Edge Function secret |
| `SUPABASE_URL` | Auto-injected by Supabase runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase runtime |
| `NEXT_PUBLIC_SITE_URL` | Supabase Edge Function secret (for CTA link in email) |

---

## Files

| File | Purpose |
|---|---|
| `supabase/functions/email-notification/index.ts` | Edge Function — webhook handler + Resend email |
