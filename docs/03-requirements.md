# 03 — Requirements

> Last updated: 2026-05-03 | Source: Product overview doc + codebase analysis. To be refined after interview rounds.

---

## Functional Requirements

### Auth & Identity
- REQ-01: Users can sign up as job seekers or companies with email/password
- REQ-02: Email confirmation is required before accessing the platform
- REQ-03: Users can reset their password via email
- REQ-04: Each user has a unique username that determines their public profile URL
- REQ-05: Role (job_seeker, company, admin) determines which dashboard the user sees

### Job Seeker Profile
- REQ-06: Job seekers complete a multi-step onboarding after sign-up
- REQ-07: Profile includes: name, username, bio, location, education, skills, projects, certifications, avatar, CV
- REQ-08: Profile is publicly accessible without login at `/job-seeker/profile/[username]`
- REQ-09: CV downloads are secured via signed URLs (not publicly guessable)
- REQ-10: Job seekers can add skills from a master skills list

### Job Discovery
- REQ-11: Job seekers see a feed of active jobs sorted by skill match ratio
- REQ-12: Jobs can be filtered by type (Full-time, Remote, Hybrid, Internship, etc.)
- REQ-13: Jobs can be searched by title or company name
- REQ-14: Each job card shows a match badge if the job seeker's skills overlap with required skills
- REQ-15: Job seekers can save jobs to a personal bookmarks list

### Applications
- REQ-16: Job seekers can apply to any active job with an optional cover letter
- REQ-17: Duplicate applications are prevented
- REQ-18: Job seekers can track their application statuses in one view

### Company Jobs
- REQ-19: Companies can post jobs with title, description, location, type, salary, requirements, and required skills
- REQ-20: Companies can edit and delete their own jobs
- REQ-21: Companies can toggle jobs active/inactive to control visibility

### Applicant Management
- REQ-22: Companies can see all applicants for their jobs
- REQ-23: Companies can view an applicant's full profile including CV
- REQ-24: Companies can move applicants through a defined status workflow
- REQ-25: Status transitions are enforced by a state machine (not arbitrary)

### Assessments
- REQ-26: Companies can send structured assessments to individual applicants
- REQ-27: Assessments support MCQ, True/False, and open-ended question types
- REQ-28: Assessments can have a time limit and deadline
- REQ-29: MCQ and True/False questions are auto-scored on submission
- REQ-30: Companies can override scores and add feedback
- REQ-31: Companies control when assessment results are visible to the applicant

### AI Interview Simulator
- REQ-32: Job seekers can configure a mock interview (role, skills, type, difficulty)
- REQ-33: The simulator generates role-specific questions using AI
- REQ-34: After completing the interview, the user receives per-question feedback and an overall score

### Admin
- REQ-35: Admin users can access an admin-only panel
- REQ-36: Admins can lock a job (`admin_locked = true`) — job hidden from seekers; company cannot reactivate until admin unlocks
- REQ-37: Admins can verify a company (`is_verified = true`) — verified badge shown next to company name
- REQ-38: Admins can block a user (`is_blocked = true`) — user removed from the system
- REQ-39: Admins can suspend a user (`is_suspended = true`) + set a reason — user notified via messaging, access restricted
- REQ-40: Job seekers can report a job — report stored with reason and status (pending/reviewed/dismissed)
- REQ-41: Admins can view and action reported jobs from the admin dashboard
- REQ-42: Every admin action is automatically logged in `admin_audit_logs` (who, what, when, why)

### Notifications
- REQ-43: Job seekers receive in-app notifications for: application status changes, assessment sent, assessment results released
- REQ-44: Companies receive in-app notifications for: new application received, assessment submitted
- REQ-45: Notifications are loaded fresh on page visit (no real-time push)
- REQ-46: Unread notification count badge shown in sidebar for both roles

### Messaging
- REQ-47: A conversation can only exist between a company and a job seeker who share an active application
- REQ-48: Messages support text content and file attachments
- REQ-49: Messages appear in real-time via Supabase Realtime
- REQ-50: Both job seekers and companies have a messaging page

### Assessment Templates
- REQ-51: Companies can create reusable assessment templates
- REQ-52: When sending an assessment, companies can load a template to prefill the form
- REQ-53: Template use count increments each time it is used to send an assessment

---

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | CVs must never be accessible via guessable public URLs |
| Security | Applicant data (profile, CV) visible only to the company that has an application from them |
| Security | AI API key never exposed to the client |
| Performance | Job feed should load in < 3 seconds with up to 100 active jobs |
| Reliability | Partial profile writes during onboarding should not create orphaned rows |
| Accessibility | Core flows must be usable on desktop Chrome/Firefox/Safari |
| Correctness | Application status transitions must follow the defined state machine |

---

## Open Questions (Remaining)

> Answered questions moved to decisions log (`09-decisions-log.md`).

1. ~~Jobs go live immediately?~~ **Resolved:** Yes, immediately. Admin can lock after the fact.
2. Should interview simulator results be stored on the candidate's profile? **Open**
3. Should company profile be publicly viewable? **Open**
4. Is the `universities` table populated with real Jordanian universities? **Open**
5. ~~Priority order?~~ **Resolved:** E → A → B → C → D
6. ~~Admin panel scope?~~ **Resolved:** Full dashboard — see REQ-36 through REQ-42
