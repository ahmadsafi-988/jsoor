# Jsoor — Documentation Index

**Jsoor (جسور)** is a smart internship and job matching platform that bridges early-career job seekers and companies through structured workflows — not just listings. Primary market: Jordan / MENA. Language: English (MVP).

---

## Navigation

| Folder | Purpose |
|---|---|
| [`01-product/`](./01-product/) | Vision, user stories, roadmap |
| [`02-architecture/`](./02-architecture/) | Tech stack, database schema, file structure |
| [`03-features/`](./03-features/) | Status and description of each feature |
| [`07-specs/`](./07-specs/) | Detailed specs for features before implementation |

---

## Spec-Driven Development Process

```
1. Identify feature or gap
2. Write a spec in docs/07-specs/<feature-name>.md
3. Break spec into concrete tasks
4. Implement step by step
5. Update docs/03-features/<feature>.md after implementation
```

Never implement a feature without a spec first.
Never merge a feature without updating its feature doc.

---

## Quick Status

| Feature | Status |
|---|---|
| Auth (login, signup, roles, email verification) | Done |
| Landing page | Done |
| Job seeker onboarding | Done |
| Company onboarding | Done |
| Job discovery & apply | Done |
| Job seeker profile (view + edit) | Done |
| AI interview simulator | Done |
| Company job management (create / edit / delete + skills) | Done |
| Database restructure (base + extensions) | Done |
| Company applicant management (status workflow + profile view) | Done |
| CV signed URL security fix | Done |
| Assessments V2 (typed questions, auto-scoring, one-question flow, timer, results release) | Done |
| Saved / bookmarked jobs | Done |
| Skill-based job matching | Done |
| Email verification on signup | Done |
| Email notifications (application status change) | Done — deploy required |
| RLS policies (job_seeker_profiles, admins) | Done |
| Admin panel | Foundation done — placeholder page live, panel post-MVP |
| Settings pages | Planned |
| Messaging & notifications | Out of scope for MVP |
| Arabic / RTL | Out of scope for MVP |
