# 10 — Testing Plan

> Last updated: 2026-05-04

---

## Testing Philosophy

This is a graduation project with production aspirations. Testing strategy:
- **No automated test suite exists** (yet)
- **Manual testing** is the current approach
- Focus on critical flows that must work for the demo
- Testing checklists below define what must pass before each milestone

---

## End-to-End Flow Checklists

### Flow A: Job Seeker Full Journey
- [ ] Sign up with a new email address
- [ ] Email confirmation link received and works
- [ ] Onboarding Step 1: fill identity, upload avatar, upload CV
- [ ] Onboarding Step 2: search and select university, fill degree/GPA/years
- [ ] Onboarding Step 3: add at least 3 skills
- [ ] Onboarding Step 4: "Done" screen shows, redirects to profile
- [ ] Public profile page renders correctly (`/job-seeker/profile/[username]`)
- [ ] CV download link works (signed URL, file downloads correctly)
- [ ] Edit profile: change bio, add project, add badge — changes persist
- [ ] Job feed loads with active jobs
- [ ] "Best Match" filter shows only matched jobs (or empty state if no skills)
- [ ] Search filters jobs correctly
- [ ] Apply to a job with a cover letter — card shows "Applied"
- [ ] Save a job — stays saved on page refresh
- [ ] Unsave a job — removed from saved jobs page
- [ ] `/job-seeker/job-applications` shows the applied job with status

### Flow B: Company Full Journey
- [ ] Sign up as company with new email
- [ ] Email confirmation works
- [ ] Company onboarding: fill name, username, industry, location, description
- [ ] Company dashboard loads with zero stats
- [ ] Create a job with title, description, location, type, salary, skills
- [ ] Job appears in company jobs list
- [ ] Edit job: change title — change persists
- [ ] Toggle job active/inactive — status updates
- [ ] Job seeker from Flow A can see/apply to this job

### Flow C: Application → Assessment → Result
Requires Flow A applicant and Flow B company job with an application.

- [ ] Company views applicant list for job — applicant appears
- [ ] Company views applicant detail: profile, bio, skills, projects, CV all visible
- [ ] Company changes status to "under_review"
- [ ] Email notification received by applicant (if trigger is wired)
- [ ] Company sends assessment: title, description, 3 MCQ + 1 true/false + 1 open question, 10 min time limit
- [ ] Applicant sees assessment in `/job-seeker/assessments`
- [ ] Applicant starts assessment — timer starts
- [ ] Applicant answers all questions and submits
- [ ] Auto-score calculated for MCQ and true/false
- [ ] Assessment status changes to "submitted"
- [ ] Company sees assessment as "Submitted" in their view
- [ ] Company reviews assessment, overrides score, adds feedback
- [ ] Company releases results
- [ ] Applicant can see score, per-question breakdown, and feedback

### Flow D: Admin Access
- [ ] Promote a user to admin via DB function
- [ ] Admin user trying to access `/job-seeker/home` is redirected to `/admin`
- [ ] Admin user trying to access `/company/home` is redirected to `/admin`
- [ ] Admin dashboard renders with real stats (users, companies, jobs, applications)

**Job management:**
- [ ] Admin can see all jobs across all companies
- [ ] Admin can lock a job — job disappears from job seeker feed
- [ ] Company cannot re-enable a locked job (shows "Locked by admin")
- [ ] Admin can unlock the job — job reappears in feed

**Company management:**
- [ ] Admin can see all companies
- [ ] Admin can verify a company — verified badge shows on job cards and company profile
- [ ] Admin can unverify a company — badge disappears

**User management:**
- [ ] Admin can see all users
- [ ] Admin can block a user — user cannot log in / is forced out
- [ ] Admin can suspend a user — user restricted, suspension reason stored

**Reports:**
- [ ] Job seeker can report a job — report appears in `/admin/reports` with `status = pending`
- [ ] Admin can mark report as reviewed or dismissed
- [ ] Admin can lock the reported job directly from the reports view

**Audit log:**
- [ ] Every admin action above appears in `/admin/audit-log` with correct admin name, action, target, and timestamp
- [ ] With multiple admins: each action shows the correct admin who performed it

### Flow F: Notifications
Requires at least one job seeker and one company, with an application in place (Flows A + B + C).

**Job seeker notifications:**
- [ ] Job seeker applies to a job → company receives `new_application` notification
- [ ] Notification appears in company `/company/notifications` on page load
- [ ] Unread badge appears on Bell nav item in company sidebar
- [ ] Company clicks notification → deep-links to applicant detail page
- [ ] "Mark all as read" button: badge disappears, all items lose green border

- [ ] Company changes application status → job seeker receives `application_status_changed` notification
- [ ] Company sends assessment → job seeker receives `assessment_sent` notification
- [ ] Job seeker submits assessment → company receives `assessment_submitted` notification
- [ ] Company releases results → job seeker receives `assessment_results_released` notification

**Notification display:**
- [ ] Notifications grouped by Today / Yesterday / Earlier
- [ ] Unread items show green left border
- [ ] Read items have no border after mark-all-read
- [ ] Empty state shown when no notifications exist

---

### Flow G: Messaging
Requires a company applicant detail page with an existing application.

**Conversation creation:**
- [ ] Company clicks "Message" on applicant detail → conversation created (or retrieved if exists)
- [ ] Company redirected to `/company/messages?conv=<id>` with conversation pre-selected
- [ ] Clicking "Message" again on same applicant → same conversation opened (no duplicate)

**Sending and receiving:**
- [ ] Company types a message and sends → message appears immediately in company chat
- [ ] Job seeker opens `/job-seeker/messages` → same conversation appears in list
- [ ] Job seeker sees the company message in the thread
- [ ] Job seeker replies → message appears immediately in job seeker chat
- [ ] **Realtime**: company window receives the job seeker reply without page refresh
- [ ] **Realtime**: job seeker window receives the company reply without page refresh

**File attachments:**
- [ ] Attach a file (e.g. PDF) and send → message shows attachment link
- [ ] Recipient can click attachment link and download the file (signed URL)

**Read status:**
- [ ] Unread message count badge shows on Messages nav item when new message arrives
- [ ] Switching to a conversation clears its unread badge
- [ ] Conversation list shows correct last message and time for each conversation

**Search:**
- [ ] Typing in conversation search filters the conversation list

---

### Flow E: Interview Simulator
Requires `OPENAI_API_KEY` to be configured.

- [ ] Set up interview: Role = "Frontend Engineer", Skills = "React, TypeScript", Type = "Technical / Coding", Level = "Mid-Level"
- [ ] Click "Initialize Simulator" — loading spinner appears
- [ ] 5 questions generated and first question displays
- [ ] Answer and advance through all 5 questions
- [ ] Evaluation screen loads with per-question feedback
- [ ] "Start Another Interview" resets to setup

---

## Known Issues / Expected Failures

| Test | Expected Result | Root Cause | Fix |
|---|---|---|---|
| Interview simulator setup → submit | 500 error | OPENAI_API_KEY missing | Add env var |
| ~~Sign-up confirmation email links~~ | ~~Wrong redirect URL~~ | ~~NEXT_PUBLIC_SITE_URL missing~~ | ✅ Fixed (Sprint 2) |
| ~~Edit profile → save → visit profile~~ | ~~Old data shown~~ | ~~revalidatePath bug~~ | ✅ Fixed (Sprint 2) |

---

## Performance Observations

- Job feed query joins skills for all active jobs — may be slow at scale. Acceptable for MVP.
- `getMyAssessments()` does two nested queries (applications → assessments) — may need optimizing later.
- Signed URL generation is done at page load per-request — cached for duration of server render.

---

## Security Checks

- [ ] CV URL is a storage path, not a public URL — cannot be guessed
- [ ] Applicant detail page redirects to `/company/home` if company doesn't own the application
- [ ] Assessment submission action verifies the submitter is the applicant on the linked application
- [ ] `updateApplicationStatus` verifies the caller is the company that owns the job
- [ ] Admin page redirects non-admins to `/`
- [ ] Interview simulator API key is server-only (not in `NEXT_PUBLIC_*`)
- [ ] `getOrCreateConversation` validates that the caller is the company on the application (not any arbitrary user)
- [ ] `getMessages` — verify a job seeker cannot read a conversation that isn't theirs
- [ ] File attachments stored in private `message-attachments` bucket — raw path is not a public URL
- [ ] `insertNotification` uses service role key server-side only — client cannot call it directly
- [ ] Blocked user accessing any authenticated route is signed out by middleware
