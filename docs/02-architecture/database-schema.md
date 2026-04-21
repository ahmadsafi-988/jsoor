# Database Schema

> Source: Inferred from `lib/supabase_generated_types.ts`.

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
| `bio` | text | |
| `avatar_url` | text | Public URL from `avatars` storage bucket |
| `cv_url` | text | Should be signed URL — **currently public, security issue** |
| `degree` | text | |
| `institution` | text | |
| `location` | text | |
| `github` | text | |
| `website` | text | |
| `role` | enum | `job_seeker` \| `company` |
| `joined_date` | timestamp | |

---

### `companies`
One row per company account.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | Matches `profiles.id` |
| `name` | text | |
| `description` | text | |
| `industry` | text | |
| `website` | text | |
| `location` | text | |
| `size` | text | e.g. "10-50", "50-200" |
| `founded_year` | int | |
| `logo_url` | text | |

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
| `type` | text | e.g. Full-time, Remote, Hybrid |
| `salary_range` | text | |
| `requirements` | text | |
| `is_active` | boolean | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `job_applications`
Tracks a job seeker's application to a specific job.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `job_id` | uuid (FK → jobs) | |
| `applicant_id` | uuid (FK → profiles) | |
| `status` | text | `pending` \| `reviewed` \| `accepted` \| `rejected` |
| `applied_at` | timestamp | |
| `updated_at` | timestamp | |

> **Gap:** No `cover_letter` column visible in schema — verify whether it's stored here or elsewhere.

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
| `questions` | jsonb | Array of question objects |
| `submission` | jsonb | Applicant's answers |
| `score` | numeric | |
| `feedback` | text | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### `projects`
Portfolio projects on a job seeker's profile.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → profiles) | |
| `name` | text | |
| `description` | text | |
| `skills` | text[] | Array of skill strings |
| `url` | text | |
| `status` | text | |

---

### `badges`
Certifications or awards on a job seeker's profile.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → profiles) | |
| `name` | text | |
| `issuer` | text | |
| `image_url` | text | |
| `url` | text | Link to verification |
| `date` | date | |

---

### `profile_to_skills`
Many-to-many mapping of job seekers to skills.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid (FK → profiles) | |
| `skills` | text | Skill name (one row per skill?) |

> **Note:** Schema shape unclear — may be a single row with array or multiple rows.

---

### `admins`
Extension table for admin users. Minimal — admins don't have a public profile.

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

## Missing Tables (Planned)

| Table | Needed For |
|---|---|
| `saved_jobs` | Bookmarked/saved jobs for job seekers |
| `messages` | Messaging system (post-MVP) |
| `notifications` | Notification system (post-MVP) |

---

## Relationships Diagram (Text)

```
auth.users
  └── profiles (1:1)
        ├── companies (1:1, if role = company)
        ├── jobs (1:many via companies)
        │     └── job_applications (1:many)
        │           └── assessments (1:1 per application)
        ├── projects (1:many)
        ├── badges (1:many)
        └── profile_to_skills (1:many)
```
