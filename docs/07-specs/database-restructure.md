# Spec: Database Restructure — Base Profiles + Role Extension Tables

**Priority:** Do this before implementing any new features  
**Status:** Spec confirmed — ready for implementation  
**Source:** Confirmed by user (Option C). Details inferred from codebase.

---

## Goal

Restructure the `profiles` table into a lean base (shared by all user roles) and move
job-seeker-specific columns into a new `job_seeker_profiles` extension table.
Add `admin` to the role enum. Create a minimal `admins` extension table.

This completes the pattern already established by the `companies` table.

---

## Current State

```
profiles (ALL users)
  id, username, first_name, last_name, avatar_url, role, joined_date   ← shared ✓
  bio, cv_url, degree, edu_start, edu_end, institution, gpa            ← job seeker only ✗
  location, website, github                                             ← job seeker only ✗
  logo_url                                                              ← unused for job seekers,
                                                                          duplicate of companies.logo_url ✗
```

---

## Target State

```
auth.users (Supabase managed)
  └── profiles          ← id, username, first_name, last_name, avatar_url, role, joined_date
        ├── job_seeker_profiles   ← bio, location, website, github, cv_url,
        │                            degree, institution, gpa, edu_start, edu_end
        ├── companies             ← already exists ✓ (name, industry, size, logo_url, etc.)
        └── admins                ← id, added_at
```

---

## Discoveries From Code Review

**Things already more complete than expected:**
- `job_applications.status` is already a rich enum: `applied | under_review | assessment_sent | assessment_completed | shortlisted | rejected`
- `updateApplicationStatus`, `sendAssessment`, `submitAssessment`, `reviewAssessment` server actions **already exist** in `lib/company/actions.ts` — only UI is missing for those features

**Issues to fix during migration:**
- `upsertCompany` writes `bio: payload.description` to `profiles` — this duplicates `companies.description`. After migration, this should stop.
- `upsertProfile` includes `logo_url` in its payload — this column will be removed from `profiles`. The action needs updating.
- `updateCvUrl` writes to `profiles.cv_url` — after migration it must write to `job_seeker_profiles.cv_url`.

---

## Step 1 — SQL Migration

Run this in Supabase SQL Editor (or as a migration file).

```sql
-- ── 1. Add 'admin' to the role CHECK constraint ──────────────────────────────
-- role is a text column with a CHECK constraint (confirmed).
-- First run this query alone to find the exact constraint name:
--   SELECT conname FROM pg_constraint
--   WHERE conrelid = 'profiles'::regclass
--     AND contype = 'c'
--     AND pg_get_constraintdef(oid) LIKE '%role%';
--
-- Replace <constraint_name> below with the result, then run:
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('job_seeker', 'company', 'admin'));

-- ── 2. Create job_seeker_profiles ────────────────────────────────────────────
CREATE TABLE job_seeker_profiles (
  id          uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio         text NOT NULL DEFAULT '',
  location    text,
  website     text,
  github      text,
  cv_url      text,           -- stores storage PATH (e.g. {userId}/cv.pdf), not full URL
  degree      text,
  institution text,
  gpa         text,
  edu_start   text,
  edu_end     text
);

-- ── 3. Migrate existing job_seeker data into job_seeker_profiles ─────────────
INSERT INTO job_seeker_profiles (
  id, bio, location, website, github, cv_url,
  degree, institution, gpa, edu_start, edu_end
)
SELECT
  id,
  COALESCE(bio, ''),
  location,
  website,
  github,
  -- cv_url currently stores a full public URL; extract the storage path from it
  -- Pattern: https://<project>.supabase.co/storage/v1/object/public/cvs/<path>
  -- We extract everything after '/cvs/'
  CASE
    WHEN cv_url LIKE '%/cvs/%'
    THEN substring(cv_url FROM position('/cvs/' IN cv_url) + 5)
    ELSE cv_url
  END,
  degree,
  institution,
  gpa,
  edu_start,
  edu_end
FROM profiles
WHERE role = 'job_seeker';

-- ── 4. Create admins table ────────────────────────────────────────────────────
CREATE TABLE admins (
  id        uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  added_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 5. Drop job-seeker-specific columns from profiles ────────────────────────
ALTER TABLE profiles
  DROP COLUMN bio,
  DROP COLUMN cv_url,
  DROP COLUMN location,
  DROP COLUMN website,
  DROP COLUMN github,
  DROP COLUMN degree,
  DROP COLUMN institution,
  DROP COLUMN gpa,
  DROP COLUMN edu_start,
  DROP COLUMN edu_end,
  DROP COLUMN logo_url;   -- unused in profiles; logo belongs in companies table only
```

> **Before running step 5:** Verify the data was correctly migrated in `job_seeker_profiles`
> by running: `SELECT * FROM job_seeker_profiles LIMIT 10;`

---

## Step 2 — Regenerate TypeScript Types

After the migration, regenerate `lib/supabase_generated_types.ts`:

```bash
npx supabase gen types typescript --project-id hmisspubbdfjrofycmgc > lib/supabase_generated_types.ts
```

---

## Step 3 — Update `lib/global_types.ts`

```typescript
import { Tables } from "./supabase_generated_types";

export type BaseProfile = Tables<"profiles">;
export type JobSeekerProfile = Tables<"job_seeker_profiles">;
export type Company = Tables<"companies">;
export type Project = Tables<"projects">;
export type Badge = Tables<"badges">;

// Full composite for a job seeker's profile page
export type FullJobSeekerProfile = {
  profile_base: BaseProfile;
  job_seeker_profile: JobSeekerProfile;
  projects: Project[];
  badges: Badge[];
  skills: string[];
};
```

---

## Step 4 — Update `lib/profile/profile_data.ts`

`getProfileByUsername` must now join `job_seeker_profiles`:

```typescript
export async function getProfileByUsername(
  username: string
): Promise<FullJobSeekerProfile | null> {
  const supabase = await createClient();

  const { data: profile_base, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !profile_base) return null;

  const { data: job_seeker_profile } = await supabase
    .from("job_seeker_profiles")
    .select("*")
    .eq("id", profile_base.id)
    .single();

  // ... rest of projects, badges, skills queries unchanged
}
```

---

## Step 5 — Update `lib/profile/actions.ts`

### `upsertProfile`
Split into two writes. Remove `logo_url`. Job-seeker fields go to `job_seeker_profiles`:

```typescript
// Write 1: base profile (shared fields only)
await supabase.from("profiles").upsert({
  id: user.id,
  first_name, last_name, username,
  joined_date: new Date().toISOString().split("T")[0],
});

// Write 2: job seeker extension
await supabase.from("job_seeker_profiles").upsert({
  id: user.id,
  bio, location, website, github,
  institution, degree, gpa, edu_start, edu_end,
});
```

### `updateCvUrl`
Change target table from `profiles` to `job_seeker_profiles`:

```typescript
await supabase
  .from("job_seeker_profiles")  // ← was "profiles"
  .update({ cv_url: cvPath })   // ← store path, not full URL
  .eq("id", user.id);
```

---

## Step 6 — Update `lib/company/actions.ts`

### `upsertCompany`
Remove `bio` from the profiles upsert (it was duplicating `companies.description`):

```typescript
await supabase.from("profiles").upsert({
  id: user.id,
  username,
  first_name: payload.name,
  last_name: "",
  // bio removed — company description lives in companies.description only
  role: "company",
  joined_date: new Date().toISOString().split("T")[0],
});
```

---

## Step 7 — Update Middleware (if needed)

If the middleware reads `profiles.role` to check for `job_seeker | company`, verify it
won't break for an `admin` row. Admin users don't have a dedicated dashboard yet —
middleware should redirect them to a placeholder or home page until `/admin` is built.

Check `lib/supabase/middleware.ts` for role-based redirects and add an `admin` case.

---

## Verification Checklist

After all changes:

- [ ] Job seeker can complete onboarding → profile row in `profiles` + `job_seeker_profiles` created
- [ ] Job seeker profile page renders correctly (bio, education, skills, etc.)
- [ ] Job seeker can edit their profile — changes persist in `job_seeker_profiles`
- [ ] Job seeker can upload a CV — `cv_url` in `job_seeker_profiles` is updated with path (not full URL)
- [ ] Company can complete onboarding → profile row in `profiles` + `companies` created
- [ ] Company profile page renders correctly
- [ ] `profiles` table no longer has job-seeker-specific columns (verify in Supabase dashboard)
- [ ] `job_seeker_profiles` table exists and has data for existing job seekers
- [ ] `admins` table exists (empty is fine)
- [ ] TypeScript compiles with no errors

---

## Files Changed Summary

| File | Change |
|---|---|
| Supabase DB | Migration SQL (new tables, drop columns, enum update) |
| `lib/supabase_generated_types.ts` | Regenerate |
| `lib/global_types.ts` | Update types |
| `lib/profile/profile_data.ts` | Join `job_seeker_profiles` in queries |
| `lib/profile/actions.ts` | Split upsert, fix `updateCvUrl` target table |
| `lib/company/actions.ts` | Remove `bio` from profiles upsert |
| `lib/supabase/middleware.ts` | Add `admin` role case |

---

## Resolved Questions

1. **Role storage format** — Text column with a CHECK constraint. Confirmed by user. Step 1 uses `DROP CONSTRAINT` + re-add.
