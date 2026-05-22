# 02 — Database Analysis

> Last updated: 2026-05-03 | Source: live DB query with service key + generated types

> ⚠️ **Types are manually maintained.** `lib/supabase_generated_types.ts` is kept in sync by hand — all tables including `notifications`, `conversations`, and `messages` have been added manually. Regenerate via CLI when `npx supabase login` is available: `npx supabase gen types typescript --project-id hmisspubbdfjrofycmgc > lib/supabase_generated_types.ts`

---

## Connection

| Setting | Value |
|---|---|
| Project URL | `https://hmisspubbdfjrofycmgc.supabase.co` |
| Auth method | Publishable key (public) + service key (edge functions) |
| Client type | `@supabase/ssr` — server + client split |

---

## Tables

### `profiles`
Core user record. One row per authenticated user. All roles share this table.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid PK | No | Matches `auth.users.id` |
| `username` | text | No | Unique; used in public profile URL `/profile/[username]` |
| `first_name` | text | No | Default `""` |
| `last_name` | text | No | Default `""` |
| `avatar_url` | text | Yes | Public URL from `avatars` storage bucket |
| `role` | text | No | `job_seeker` \| `company` \| `admin`; default `job_seeker` |
| `joined_date` | text | No | ISO date string |
| `is_blocked` | boolean | No | Default `false`. Admin sets `true` → user removed from system. **Not in generated types.** |
| `is_suspended` | boolean | No | Default `false`. Admin sets `true` → user notified via messaging + access restricted. **Not in generated types.** |
| `suspension_reason` | text | Yes | Reason for suspension, set by admin. **Not in generated types.** |

**Notes:**
- Role is set during onboarding via `upsertProfile` / `upsertCompany`
- Admin role is set via DB trigger when row inserted into `admins`
- Used as pivot for all role-based queries
- `is_blocked` / `is_suspended` exist in DB but middleware does not yet check them — blocked users can still log in

---

### `job_seeker_profiles`
Extension table for job-seeker-specific data. 1:1 with `profiles`.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid PK, FK → profiles | No | |
| `bio` | text | No | Default `""` |
| `cv_url` | text | Yes | Storage path (e.g. `userId/cv.pdf`), NOT a public URL |
| `degree` | text | Yes | e.g. "B.Sc. Computer Science" |
| `institution` | text | Yes | University name |
| `gpa` | text | Yes | e.g. "3.8" |
| `edu_start` | text | Yes | ISO date string (year-01-01) |
| `edu_end` | text | Yes | ISO date string or null for "Present" |
| `github` | text | Yes | GitHub handle (no URL prefix) |
| `location` | text | Yes | Free text, e.g. "Amman, JO" |
| `website` | text | Yes | Domain only, no `https://` |

**Notes:**
- `cv_url` stores a storage path. Signed URLs are generated server-side via `lib/storage/cv.ts` at read time.
- Row is created during job seeker onboarding.

---

### `companies`
Extension table for company accounts. 1:1 with `profiles` where `role = company`.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid PK | No | Matches `profiles.id` |
| `name` | text | No | Company display name |
| `description` | text | No | Default `""` |
| `industry` | text | Yes | e.g. "Technology" |
| `website` | text | Yes | |
| `location` | text | Yes | |
| `size` | text | Yes | e.g. "10-50", "50-200" |
| `founded_year` | text | Yes | |
| `logo_url` | text | Yes | Public URL from `avatars` bucket |
| `is_verified` | boolean | No | Default `false`. Admin sets `true` → verified badge shown next to company name. **Not in generated types.** |
| `created_at` | timestamptz | Yes | Auto-set on insert |

---

### `jobs`
Job listings posted by companies.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid PK | No | Auto-generated |
| `company_id` | uuid FK → companies | No | |
| `title` | text | No | |
| `description` | text | No | |
| `location` | text | Yes | |
| `type` | text | No | `Full-time` \| `Part-time` \| `Remote` \| `Hybrid` \| `Contract` \| `Internship`; default `Full-time` |
| `salary_range` | text | Yes | Free text, e.g. "800–1200 JOD/month" |
| `requirements` | text | Yes | Long text, freeform |
| `is_active` | boolean | No | Default `true`; controls visibility to job seekers |
| `admin_locked` | boolean | No | Default `false`. Admin sets `true` → hidden from job seekers even if `is_active = true`; company cannot reactivate until admin removes lock. **Not in generated types.** |
| `created_at` | timestamptz | No | Auto-set |
| `updated_at` | timestamptz | No | Must be manually updated |

---

### `job_applications`
Tracks a job seeker's application to a specific job.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid PK | No | Auto-generated |
| `job_id` | uuid FK → jobs | No | |
| `applicant_id` | uuid FK → auth.users | No | **Important: FK to `auth.users`, not `profiles`** |
| `cover_letter` | text | Yes | Optional message at apply time |
| `status` | text | No | See status values below |
| `created_at` | timestamptz | No | |
| `updated_at` | timestamptz | No | |

**Status values (as implemented in `lib/company/actions.ts`):**

| Status | Description |
|---|---|
| `applied` | Initial state on application |
| `under_review` | Company is reviewing |
| `shortlisted` | Candidate shortlisted |
| `rejected` | Candidate rejected |
| `assessment_sent` | Assessment sent to applicant |
| `assessment_completed` | Applicant submitted assessment |

**Allowed transitions (state machine):**
```
applied          → under_review
under_review     → applied | shortlisted | rejected
shortlisted      → under_review
rejected         → under_review
assessment_sent  → under_review
```

**Critical DB note:** `applicant_id` FK points to `auth.users`, not `profiles`. PostgREST cannot resolve nested joins across this boundary. Always fetch profile data in a separate query.

---

### `assessments`
Assessments sent from a company to a specific applicant.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid PK | No | |
| `company_id` | uuid FK → companies | No | |
| `application_id` | uuid FK → job_applications | No | |
| `title` | text | No | |
| `description` | text | No | |
| `deadline` | timestamptz | Yes | |
| `time_limit` | integer | Yes | Minutes; null = no limit |
| `status` | text | No | `pending` \| `submitted` \| `reviewed` |
| `questions` | jsonb | Yes | Array of question objects (see below) |
| `submission` | jsonb | Yes | `{ answers: Record<string, any>, submitted_at: string }` |
| `score` | numeric | Yes | Auto-calculated at submission for MCQ/T-F; null if all open |
| `results_released` | boolean | No | Default `false`; company explicitly releases to applicant |
| `feedback` | text | Yes | Company's written feedback |
| `created_at` | timestamptz | No | |
| `updated_at` | timestamptz | No | |

**Question object shape:**
```json
{
  "question": "string",
  "type": "mcq" | "truefalse" | "open",
  "options": ["A", "B", "C", "D"],   // MCQ only
  "correct": 0,                        // MCQ: index; truefalse: true/false
}
```

---

### `skills`
Master list of technology/skill names.

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | Auto-increment |
| `name` | text | e.g. "React", "Python", "SQL" |

---

### `profile_to_skills`
Many-to-many: which skills a job seeker claims.

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | Auto-increment |
| `user_id` | uuid FK → profiles | |
| `skill_id` | integer FK → skills | |

---

### `job_to_skills`
Many-to-many: which skills a job requires.

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | Auto-increment (generated always) |
| `job_id` | uuid FK → jobs | |
| `skill_id` | integer FK → skills | |

---

### `projects`
Portfolio projects on a job seeker's profile.

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | Auto-increment |
| `user_id` | uuid FK → profiles | |
| `name` | text | |
| `description` | text | |
| `url` | text | GitHub or live URL |
| `status` | text | e.g. "Live", "In Progress" |
| `created_at` | timestamptz | |

**Note:** Projects can also have associated skills via `project_to_skills`.

---

### `project_to_skills`
Many-to-many: which skills a project used.

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | |
| `project_id` | integer FK → projects | |
| `skill_id` | integer FK → skills | |

---

### `badges`
Certifications/awards displayed on a job seeker's profile.

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | |
| `user_id` | uuid | Nullable; no FK constraint in generated types |
| `name` | text | Certification name |
| `issuer` | text | e.g. "Google", "Coursera" |
| `image` | text | Image URL |
| `url` | text | Verification link |
| `date` | text | Issue date |
| `created_at` | timestamptz | |

---

### `saved_jobs`
Jobs bookmarked by a job seeker.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid FK → profiles | Composite PK with job_id |
| `job_id` | uuid FK → jobs | |
| `saved_at` | timestamptz | Default: now() |

---

### `universities`
University list for the onboarding autocomplete.

| Column | Type | Notes |
|---|---|---|
| `id` | integer PK | |
| `name` | text | |
| `logo_url` | text | |

---

### `admins`
Extension table for admin users.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK, FK → profiles | |
| `added_at` | timestamptz | Auto-set |

**How to promote a user to admin:**
```sql
-- Option 1: Use the DB function
SELECT promote_to_admin('user-uuid', 'admin_username', 'Admin Name');

-- Option 2: Direct insert (triggers profile.role update)
INSERT INTO admins (id) VALUES ('<user-uuid>');
```

---

### `admin_audit_logs`
Logs every admin action for accountability and audit trail.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `admin_id` | uuid FK → profiles | Which admin performed the action |
| `action` | text | e.g. `lock_job`, `verify_company`, `block_user`, `suspend_user` |
| `target_type` | text | e.g. `job`, `company`, `user` |
| `target_id` | text | UUID of the affected row |
| `target_label` | text | Human-readable label (e.g. job title, company name) |
| `reason` | text | Optional reason entered by admin |
| `created_at` | timestamptz | Auto-set |

---

### `job_reports`
Allows users to report a job posting to admin. Admin reviews via `/admin/reports`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `job_id` | uuid FK → jobs | The reported job |
| `reported_by` | uuid FK → profiles | Who filed the report |
| `reason` | text | Report reason |
| `status` | text | e.g. `pending`, `reviewed`, `dismissed` |
| `created_at` | timestamptz | Auto-set |

---

### `assessment_templates`
Allows companies to save reusable assessment templates. **Fully built (Sprint 6)** — list, create, edit, delete pages at `/company/assessments/templates`; "Load Template" picker in send-assessment form; `use_count` incremented on each use via `lib/company/templates.ts`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `company_id` | uuid FK → companies | Owner company |
| `title` | text | Template name |
| `description` | text | |
| `questions` | jsonb | Same question object shape as `assessments.questions` |
| `time_limit` | integer | Minutes; null = no limit |
| `tags` | array | Text tags for filtering/searching templates |
| `use_count` | integer | How many times template was used to send an assessment |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## Database Functions

| Function | Args | Description |
|---|---|---|
| `promote_to_admin` | `user_id, admin_username, admin_name` | Sets profile role to admin; inserts into admins table |

---

### `notifications`
Shared in-app notification store for all user roles. Created by server actions via service role client.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid PK | No | Default `gen_random_uuid()` |
| `user_id` | uuid FK → profiles | No | Recipient |
| `type` | text | No | See type values below |
| `title` | text | No | Short headline |
| `body` | text | No | Full message text |
| `link` | text | Yes | URL to navigate to on click |
| `is_read` | boolean | No | Default `false` |
| `created_at` | timestamptz | Yes | Default `now()` |

**Type values and triggers:**

| Type | Recipient | Triggering action |
|---|---|---|
| `application_status_changed` | Job seeker | `updateApplicationStatus` |
| `assessment_sent` | Job seeker | `sendAssessment` |
| `assessment_results_released` | Job seeker | `releaseAssessmentResults` |
| `new_application` | Company | `applyToJob` |
| `assessment_submitted` | Company | `submitAssessment` |

**RLS:** User can SELECT/UPDATE own rows; authenticated users can INSERT (inserts happen via service role client in server actions to bypass RLS for cross-user writes).
**Index:** `(user_id, created_at DESC)`

---

### `conversations`
One conversation per application. Created lazily when a company clicks "Message" on an applicant detail page.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid PK | No | Default `gen_random_uuid()` |
| `application_id` | uuid FK → job_applications | No | UNIQUE — one conversation per application |
| `job_seeker_id` | uuid FK → profiles | No | |
| `company_id` | uuid FK → profiles | No | |
| `created_at` | timestamptz | No | Default `now()` |

**RLS:** SELECT/INSERT visible only to `job_seeker_id` or `company_id`.
**Indexes:** `(job_seeker_id)`, `(company_id)`

---

### `messages`
Individual messages within a conversation.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid PK | No | Default `gen_random_uuid()` |
| `conversation_id` | uuid FK → conversations | No | |
| `sender_id` | uuid FK → profiles | No | |
| `content` | text | No | Default `""` (empty for attachment-only messages) |
| `attachment_url` | text | Yes | Storage path in `message-attachments` bucket |
| `attachment_name` | text | Yes | Original filename for display |
| `is_read` | boolean | No | Default `false` |
| `created_at` | timestamptz | No | Default `now()` |

**RLS:** Participants of the parent conversation only (SELECT/INSERT/UPDATE).
**Realtime:** `REPLICA IDENTITY FULL` + added to `supabase_realtime` publication. Subscribe to `INSERT` events filtered by `conversation_id`.
**Storage bucket:** `message-attachments` (private, 10MB limit). Attachments uploaded client-side; signed URLs generated at read time.
**Index:** `(conversation_id, created_at ASC)`

---

## Entity Relationship Summary

```
auth.users
  └── profiles (1:1)
        ├── job_seeker_profiles (1:1, role = job_seeker)
        │     ├── profile_to_skills (1:many) → skills
        │     ├── projects (1:many)
        │     │     └── project_to_skills (1:many) → skills
        │     ├── badges (1:many)
        │     └── saved_jobs (1:many) → jobs
        ├── companies (1:1, role = company)
        │     ├── jobs (1:many)
        │     │     ├── job_to_skills (1:many) → skills
        │     │     ├── job_reports (1:many) ← profiles
        │     │     └── job_applications (1:many)
        │     │           ├── assessments (1:1 per application)
        │     │           └── conversations (1:1 per application)
        │     │                 └── messages (1:many)
        │     └── assessment_templates (1:many)
        ├── admins (1:1, role = admin)
        │     └── admin_audit_logs (1:many)
        └── notifications (1:many)

universities (standalone lookup)
```

---

## RLS Summary

| Table | RLS | Read | Write |
|---|---|---|---|
| `profiles` | Off | Public | Authenticated users (own row) |
| `job_seeker_profiles` | On | Job seeker (own) + companies (their applicants) | Job seeker (own row) |
| `companies` | On | Public | Company (own row) |
| `jobs` | On | Anyone (active, not locked); company sees all own | Company (own jobs) |
| `job_applications` | On | Applicant or company (job owner) | Authenticated insert; company UPDATE status |
| `assessments` | On | Company (owner) + applicant (own app) | Company inserts/updates; applicant UPDATE for submission |
| `saved_jobs` | On | Job seeker (own) | Job seeker (own) |
| `skills` | Varies | Public read | Admin/platform only |
| `profile_to_skills` | Varies | Public | Authenticated (own user) |
| `job_to_skills` | Varies | Public | Company (own job) |
| `projects` | Varies | Public | Authenticated (own user) |
| `badges` | Varies | Public | Authenticated (own user) |
| `admins` | On | Admin (own row) | Admin/DB only |
| `admin_audit_logs` | On | Admin only | Admin (inserts via `logAdminAction` helper) |
| `job_reports` | On | Admin + reporter | Authenticated insert; admin updates status |
| `assessment_templates` | On | Company (own) | Company (own templates) |
| `notifications` | On | User (own rows) | Authenticated insert via service role; user UPDATE own |
| `conversations` | On | Participants only (`job_seeker_id` or `company_id`) | Authenticated insert |
| `messages` | On | Conversation participants only | Participants insert/update |

---

## Missing Tables (Needed for Future Features)

| Table | Feature | Priority |
|---|---|---|
| `platform_assessments` | Platform-level skill tests | Low (post-MVP) |

---

## Code ↔ DB Mismatches

| Issue | Location | Impact |
|---|---|---|
| `applicant_id` FK to `auth.users` not `profiles` | `job_applications` | All profile joins for applicants require 2 queries — known and handled everywhere |
| Status values mismatch | `job_applications.status` | **Resolved** — DB constraint confirmed via `list_tables`: `applied`, `under_review`, `assessment_sent`, `assessment_completed`, `shortlisted`, `rejected` — matches `ALLOWED_TRANSITIONS` exactly |
| `badges.user_id` — no FK constraint in generated types | `badges` | Risk of orphaned badge rows (low priority) |
