# User Stories

Format: `As a <role>, I want to <action> so that <outcome>.`
Status: `done` | `partial` | `planned`

> Source: Confirmed by user interview (2026-04-21).

---

## Authentication

| # | Story | Status |
|---|---|---|
| A1 | As a visitor, I want to sign up with email and password so that I can create an account. | `done` |
| A2 | As a new user, I want to confirm my email before accessing the app. | `done` |
| A3 | As a user, I want to log in and be redirected to my role-specific dashboard. | `done` |
| A4 | As a user, I want to reset my password via email if I forget it. | `done` |
| A5 | As a new user, I am assigned a role (job seeker or company) during onboarding. | `done` |

---

## Job Seeker — Profile & Portfolio

| # | Story | Status |
|---|---|---|
| P1 | As a job seeker, I want to build a public profile with my bio, education, and skills so that companies can evaluate me beyond my CV. | `done` |
| P2 | As a job seeker, I want to add projects to my profile with skills and links so that I can demonstrate real work. | `done` |
| P3 | As a job seeker, I want to add badges and certifications so that I can show verified achievements. | `done` |
| P4 | As a job seeker, I want to upload a profile avatar. | `done` |
| P5 | As a job seeker, I want to upload my CV securely so that only authorized parties can access it. | `done` — private bucket, signed URL generated server-side at read time |
| P6 | As a visitor, I want to view a job seeker's public profile via their username URL. | `done` |
| P7 | As a job seeker, I want my profile to act as a dynamic portfolio that grows as I complete assessments and projects. | `planned` — concept pending definition |

---

## Job Seeker — Job Discovery & Applications

| # | Story | Status |
|---|---|---|
| J1 | As a job seeker, I want to browse job listings with search and filters so that I can find relevant internships and entry-level roles. | `done` |
| J2 | As a job seeker, I want to apply to a job with an optional cover letter. | `done` |
| J3 | As a job seeker, I want to see all my submitted applications and their current statuses. | `done` |
| J4 | As a job seeker, I want to save/bookmark jobs for later. | `done` |
| J5 | As a job seeker, I want to see jobs that match my skills so I don't have to search manually. | `done` — skill match ratio + Strong/Partial Match badges; jobs sorted by match |

---

## Job Seeker — Growth Tools

| # | Story | Status |
|---|---|---|
| G1 | As a job seeker, I want to do a mock interview to prepare for real interviews. | `done` |
| G2 | As a job seeker, I want to receive AI feedback on each interview answer so I can improve. | `done` |
| G3 | As a job seeker, I want to take platform-level assessments to build verified skill signals on my profile. | `planned` |
| G4 | As a job seeker, I want to complete company-sent assessments as part of a hiring process. | `done` — full taker UI: instructions, timer, MCQ/T-F/Open, auto-submit |
| G5 | As a job seeker, I want to see my assessment results saved to my record. | `done` — score + per-question breakdown visible after company releases results |

---

## Company — Setup & Profile

| # | Story | Status |
|---|---|---|
| C1 | As a company, I want to complete an onboarding wizard to set up my profile. | `done` |
| C2 | As a company, I want to edit my company profile at any time. | `partial` |

---

## Company — Job Management

| # | Story | Status |
|---|---|---|
| JM1 | As a company, I want to post a new job listing with title, description, type, and location. | `done` |
| JM2 | As a company, I want to view all my active job listings. | `done` |
| JM3 | As a company, I want to edit or deactivate a job listing. | `done` |

---

## Company — Applicant Management (Next Priority)

| # | Story | Status |
|---|---|---|
| AM1 | As a company, I want to see all applicants for a specific job. | `done` |
| AM2 | As a company, I want to open an applicant's full profile including projects, skills, and badges. | `done` |
| AM3 | As a company, I want to view an applicant's CV securely via a time-limited link. | `done` — signed URL generated server-side |
| AM4 | As a company, I want to update an applicant's status using defined transition rules. | `done` — `ALLOWED_TRANSITIONS` state machine enforced server + client |
| AM5 | As a company, I want to send a custom assessment to a specific applicant. | `done` — MCQ/T-F/Open builder with time limit + deadline |
| AM6 | As a company, I want to view an applicant's assessment results. | `done` — score, per-question breakdown, feedback, release toggle |
| AM7 | As a company, I want to message an applicant directly. | `done` — "Message" button on applicant detail creates conversation + redirects to messages |

---

## Admin

| # | Story | Status |
|---|---|---|
| AD1 | As an admin, I want to lock or unlock job postings to control their visibility. | `done` — lock hides from job feed; company blocked from reactivating while locked |
| AD2 | As an admin, I want to verify that companies are legitimate. | `done` — verified badge on job cards + company profile |
| AD3 | As an admin, I want to block or suspend users for violations. | `done` — block forces sign-out; suspend shows reason page |
| AD4 | As an admin, I want to review job reports from job seekers. | `done` — admin reports page; can review, dismiss, or lock from report view |
| AD5 | As an admin, I want a complete audit trail of all admin actions. | `done` — `admin_audit_logs` auto-written; visible at `/admin/audit-log` |
| AD6 | As an admin, I want a dashboard showing platform-wide stats. | `done` — total users, companies, jobs, applications |
| AD7 | As an admin, I want to manage platform-level assessments. | `planned` — post-MVP |

## Messaging & Notifications

| # | Story | Status |
|---|---|---|
| MN1 | As a job seeker, I want to receive in-app notifications when my application status changes. | `done` |
| MN2 | As a job seeker, I want to receive a notification when a company sends me an assessment. | `done` |
| MN3 | As a job seeker, I want to receive a notification when assessment results are released. | `done` |
| MN4 | As a company, I want to receive a notification when a new application arrives. | `done` |
| MN5 | As a company, I want to receive a notification when an applicant submits an assessment. | `done` |
| MN6 | As a job seeker or company, I want to send and receive messages in real time. | `done` — Supabase Realtime, text + file attachments |
| MN7 | As a job seeker or company, I want to see an unread badge on my messages and notifications nav items. | `done` |
