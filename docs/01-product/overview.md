# Product Overview

> ⚠️ **LEGACY — OUTDATED.** Use `docs/00-project-overview.md` and `docs/05-features-specification.md` instead. This file predates the 2026-05-03 spec-driven analysis and contains decisions that have since changed (e.g. admin and messaging marked as out of scope — they are now in scope).

> Source: Confirmed by user (interview, 2026-04-21).

---

## What is Jsoor?

**Jsoor (جسور)** means "bridges" in Arabic.

Jsoor is a smart internship and job matching platform that connects job seekers with companies through structured workflows — not just listings.

Instead of only applying to jobs, users go through a guided process that includes profile building, skill evaluation, and assessments. This helps companies find more suitable candidates and makes the hiring process more efficient.

---

## Core Differentiator

Unlike traditional job boards (LinkedIn, Bayt, etc.), Jsoor focuses on **structured matching** rather than passive listings.

The platform is designed to:
- Evaluate candidates based on skills and assessments, not just CVs
- Give companies better visibility into applicants beyond basic profiles
- Create a guided hiring workflow instead of a simple "apply and wait" process

**Goal:** Reduce randomness in hiring and make matching more intentional and data-driven.

---

## Target Users

### Primary: Job Seekers
**Who:** Students and fresh graduates looking for internships or entry-level jobs.

**Pain points this group faces:**
- Lack of experience to put on a CV
- Unclear career direction
- Difficulty standing out among other candidates

**How Jsoor helps:** Candidates showcase skills through profiles, projects, and assessments rather than relying only on traditional resumes.

> Future expansion: mid-career professionals — out of scope for MVP.

### Secondary: Companies
Organizations posting internships and entry-level roles who want:
- Structured applicant pipelines
- Skill-based filtering and assessment signals
- Better candidate evaluation beyond the CV

---

## Market

| Attribute | Value |
|---|---|
| Primary market | Jordan |
| Regional target | MENA |
| Long-term | Global (platform designed to scale) |
| Language (MVP) | English only |
| Arabic / RTL | Post-MVP |

---

## Data-Driven Matching

Matching in Jsoor uses structured data from both sides:

**Candidate signals:**
- Skills (listed + verified via assessments)
- Projects
- Profile data
- Assessment results

**Job signals:**
- Required skills
- Job description
- Role expectations

**In practice:**
- Suggest relevant jobs to candidates based on their profiles
- Rank or filter candidates for companies based on match quality

**Approach:** Rule-based first (skill matching), evolving into scoring/recommendation systems later.

---

## Assessment System

Two types of assessments:

### 1. Company-Created Assessments
- Sent by companies to specific applicants as part of the hiring process
- Job-specific, used for evaluation before shortlisting or hiring

### 2. Platform-Level Assessments
- Created and maintained by Jsoor (technical, aptitude, domain-based)
- Any candidate can take them independently to build a verified profile
- Results contribute as **signals** on the candidate's profile (scores, badges, completion status)
- Help companies evaluate candidates even before applying

---

## AI Interview Simulator

- **Role:** Secondary but strategic feature — not required for core MVP
- **Current use:** Private practice tool for candidates
- **Future potential:** Optionally contribute signals to candidate profile (mock interview completion, performance summaries)
- **Philosophy:** Help candidates improve, not just evaluate them

---

## Admin Role

The admin acts as a system moderator and trust layer.

**Responsibilities:**
- **Job moderation:** Approve, edit, or reject job postings before they go live
- **Company oversight:** Verify companies are legitimate and posting valid opportunities
- **User monitoring:** Handle reports and suspicious activity
- **Platform data:** Review assessments, maintain system integrity

**Core problem the admin solves:** Trust and quality — preventing spam, fake jobs, and ensuring fair usage for both sides of the platform.

---

## Planned Feature: Dynamic Portfolio

> ⚠️ Definition pending — to be defined by user in a future session.

The candidate profile is envisioned as a "dynamic portfolio" — a living record that grows as the candidate takes assessments, completes projects, and builds their presence on the platform.

---

## Project Context

| Attribute | Value |
|---|---|
| Type | Graduation project, production-minded MVP |
| Academic deadline | ~1–2 months from project start |
| Post-launch intent | Continue as a real product after submission |
| Mindset | Not a demo — code quality, security, and UX matter |

---

## MVP Definition

The single most important deliverable for the academic deadline:

> **A full end-to-end hiring workflow:**
> 1. Company posts a job
> 2. Job seeker applies
> 3. Company views applicants
> 4. Company reviews candidate profile (CV + assessment signals)
> 5. Company updates applicant status (applied → reviewed → accepted/rejected)

This complete loop — from job creation to evaluation to decision — demonstrates a real, usable system.

---

## Out of Scope for MVP

- Arabic language / RTL layout
- Real-time messaging
- Advanced analytics or recommendation AI
- Mobile app
- Payment / subscription model
- Admin panel (DB-level only for now)
- Mid-career professional targeting
