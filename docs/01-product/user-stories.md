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
| P5 | As a job seeker, I want to upload my CV securely so that only authorized parties can access it. | `partial` — upload done; signed URL pending |
| P6 | As a visitor, I want to view a job seeker's public profile via their username URL. | `done` |
| P7 | As a job seeker, I want my profile to act as a dynamic portfolio that grows as I complete assessments and projects. | `planned` — concept pending definition |

---

## Job Seeker — Job Discovery & Applications

| # | Story | Status |
|---|---|---|
| J1 | As a job seeker, I want to browse job listings with search and filters so that I can find relevant internships and entry-level roles. | `done` |
| J2 | As a job seeker, I want to apply to a job with an optional cover letter. | `done` |
| J3 | As a job seeker, I want to see all my submitted applications and their current statuses. | `done` |
| J4 | As a job seeker, I want to save/bookmark jobs for later. | `planned` — no DB backing yet |
| J5 | As a job seeker, I want to see jobs that match my skills so I don't have to search manually. | `planned` |

---

## Job Seeker — Growth Tools

| # | Story | Status |
|---|---|---|
| G1 | As a job seeker, I want to do a mock interview to prepare for real interviews. | `done` |
| G2 | As a job seeker, I want to receive AI feedback on each interview answer so I can improve. | `done` |
| G3 | As a job seeker, I want to take platform-level assessments to build verified skill signals on my profile. | `planned` |
| G4 | As a job seeker, I want to complete company-sent assessments as part of a hiring process. | `partial` — UI done; send flow needs UI |
| G5 | As a job seeker, I want to see my assessment results saved to my record. | `planned` |

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
| AM2 | As a company, I want to open an applicant's full profile including projects, skills, and badges. | `partial` |
| AM3 | As a company, I want to view an applicant's CV securely via a time-limited link. | `planned` |
| AM4 | As a company, I want to update an applicant's status using defined transition rules. | `planned` |
| AM5 | As a company, I want to send a custom assessment to a specific applicant. | `planned` — action exists; UI missing |
| AM6 | As a company, I want to view an applicant's assessment results. | `planned` |

---

## Admin

| # | Story | Status |
|---|---|---|
| AD1 | As an admin, I want to approve or reject job postings before they go live. | `planned` |
| AD2 | As an admin, I want to verify that companies are legitimate before they can post jobs. | `planned` |
| AD3 | As an admin, I want to monitor and handle reported users or suspicious activity. | `planned` |
| AD4 | As an admin, I want to manage platform-level assessments. | `planned` |
