# Database Schema

> ⚠️ **LEGACY — OUTDATED.** Use `docs/02-database-analysis.md` instead. This file was generated from stale TypeScript types and is missing 6 columns and 3 entire tables. Status values, FKs, and column types are incorrect in several places.

> Source: `lib/supabase_generated_types.ts`

---

## Tables

### `profiles`
Extends Supabase Auth `auth.users`. One row per user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Matches `auth.users.id` |
| `username` | text | Unique; used in public profile URL |
| `first_name` | text | |
| `last_name` | text | |
| `avatar_url` | text | Public URL from `avatars` storage bucket |
| `role` | enum | `job_seeker` \| `company` \| `admin` |
| `joined_date` | timestamp | |

---

### `job_seeker_profiles`
Extension table for job seeker-specific data. One row per job seeker (1:1 with `profiles`).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK, FK → profiles.id) | |
| `bio` | text | Defaults to `""` |
| `cv_url` | text | Storage path only (e.g. `userId/cv.pdf`); signed URLs generated server-side at read time via `lib/storage/cv.ts` |
| `degree` | text | |
| `institution` | text | |
| `gpa` | text | |
| `edu_start` | text | |
| `edu_end` | text | |
| `github` | text | |
| `location` | text | |
| `website` | text | |

---

### `companies`
One row per company account. 1:1 with `profiles` where `role = company`.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK, FK → profiles.id) | |
| `name` | text | |
| `description` | text | |
| `industry` | text | |
| `website` | text | |
| `location` | text | |
| `size` | text | e.g. "10-50", "50-200" |
| `founded_year` | int | |
| `logo_url` | text | Public URL from `avatars` bucket |

---

### `jobs`
Job listings posted by companies.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `company_id` | uuid (FK → companies) | |
| `title` | text | |
| `description` | text | |
| `location` | text | |
| `type` | text | Full-time / Part-time / Remote / Hybrid / Contract / Internship |
| `salary_range` | text | |
| `requirements` | text | |
| `is_active` | boolean | Controls visibility to job seekers |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `job_to_skills`
Many-to-many: which skills a job requires.

| Column | Type | Notes |
|---|---|---|
| `job_id` | uuid (FK → jobs) | |
| `skill_id` | int (FK → skills) | |

---

### `skills`
Master skills list.

| Column | Type | Notes |
|---|---|---|
| `id` | int (PK) | |
| `name` | text | e.g. "React", "Python" |

---

### `profile_to_skills`
Many-to-many: which skills a job seeker has.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid (FK → profiles) | |
| `skill_id` | int (FK → skills) | |

---

### `job_applications`
Tracks a job seeker's application to a specific job.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `job_id` | uuid (FK → jobs) | |
| `applicant_id` | uuid (FK → profiles) | |
| `cover_letter` | text | Optional; submitted at apply time |
| `status` | text | `pending` \| `reviewed` \| `shortlisted` \| `accepted` \| `rejected` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

**Allowed status transitions** (enforced in `lib/company/actions.ts` via `ALLOWED_TRANSITIONS`):
- `pending` → `reviewed`, `rejected`
- `reviewed` → `shortlisted`, `rejected`
- `shortlisted` → `accepted`, `rejected`
- `rejected` → `reviewed` (reconsider)

---

### `assessments`
Assessments sent from company to applicant, linked to a specific application.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `company_id` | uuid (FK → companies) | |
| `application_id` | uuid (FK → job_applications) | |
| `title` | text | |
| `description` | text | |
| `deadline` | timestamp | |
| `status` | text | `pending` \| `submitted` \| `reviewed` |
| `questions` | jsonb | Array of typed question objects — see Assessments V2 spec |
| `submission` | jsonb | `{ answers: Record<string, string \| number \| boolean>, submitted_at: string }` |
| `score` | numeric | Auto-calculated at submission for MCQ/T-F; null if all open-ended |
| `time_limit` | integer | Optional time limit in minutes; null = no limit |
| `results_released` | boolean | Controls whether the job seeker can see their score and breakdown |
| `feedback` | text | Company's written feedback |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `saved_jobs`
Jobs bookmarked by a job seeker.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid (FK → profiles) | |
| `job_id` | uuid (FK → jobs) | |
| `saved_at` | timestamp | |

---

### `projects`
Portfolio projects on a job seeker's profile.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → profiles) | |
| `name` | text | |
| `description` | text | |
| `skills` | text[] | Array of skill strings (freeform, separate from `skills` table) |
| `url` | text | |
| `status` | text | e.g. "Live", "In Progress" |

---

### `badges`
Certifications or awards on a job seeker's profile.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → profiles) | |
| `name` | text | |
| `issuer` | text | |
| `image` | text | Image URL |
| `url` | text | Link to verification |
| `date` | text | |

---

### `admins`
Extension table for admin users.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK, FK → profiles.id) | |
| `added_at` | timestamptz | Auto-set on insert |

**How to add an admin:**
1. Create user in Supabase Auth dashboard (email + password)
2. Copy UUID
3. `INSERT INTO admins (id) VALUES ('<uuid>');`
4. Trigger `on_admin_inserted` fires → sets `profiles.role = 'admin'` automatically

---

### Forum tables
Added for the Forums MVP.

| Table | Purpose |
|---|---|
| `forums` | Approved forum communities with unique `name` and `slug` |
| `forum_creation_requests` | Job seeker forum requests awaiting admin approval/rejection |
| `forum_posts` | Forum posts with real `author_id`, `is_anonymous`, and moderation flags |
| `forum_post_images` | Private storage attachment paths for post image galleries |
| `forum_comments` | Comments and one-level replies via nullable `parent_comment_id` |
| `forum_votes` | One vote per user per post/comment target |
| `forum_reports` | User reports for posts/comments |
| `forum_moderators` | Reserved for future per-forum moderation roles |

Forum image files live in the private `forum-media` Supabase Storage bucket. The database stores storage paths; server code creates signed URLs for display.

---

## RLS Policy Summary

| Table | RLS | Policies |
|---|---|---|
| `profiles` | Off | Public read; users update own row |
| `job_seeker_profiles` | On | Job seekers read/insert/update own row; companies read profiles of their applicants |
| `companies` | On | Public read; company updates own row |
| `jobs` | On | Anyone reads active jobs; company owner reads all their jobs; company inserts/updates/deletes own jobs |
| `job_applications` | On | Applicant or company (job owner) can SELECT; company can UPDATE status; authenticated users can INSERT |
| `saved_jobs` | On | Job seekers manage their own saved jobs only |
| `assessments` | On | Company (job owner) and applicant can read; company inserts/updates/deletes; applicant UPDATE uses USING `status='pending'` + WITH CHECK `status='submitted'` to enforce one-way submission |
| `admins` | On | Admins read their own row only |
| `projects`, `badges`, `profile_to_skills`, `skills`, `job_to_skills` | Varies | Owners manage their own rows; public or authenticated read |

> **Important:** `job_applications.applicant_id` FK points to `auth.users` (not `profiles`). PostgREST cannot resolve nested joins across this boundary. Always fetch profiles in a separate query when joining with `job_applications`.

---

## Relationships Diagram (Text)

```
auth.users
  └── profiles (1:1)
        ├── job_seeker_profiles (1:1, if role = job_seeker)
        │     ├── profile_to_skills (1:many) → skills
        │     ├── projects (1:many)
        │     ├── badges (1:many)
        │     └── saved_jobs (1:many) → jobs
        ├── companies (1:1, if role = company)
        │     └── jobs (1:many)
        │           ├── job_to_skills (1:many) → skills
        │           └── job_applications (1:many)
        │                 └── assessments (1:1 per application)
        └── admins (1:1, if role = admin)
```
