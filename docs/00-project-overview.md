# 00 — Project Overview

> Last updated: 2026-05-03 | Status: Active development

---

## What is Jsoor?

**Jsoor (جسور)** means "bridges" in Arabic.

Jsoor is a smart internship and job matching platform that connects job seekers (students and fresh graduates) with companies through structured hiring workflows — not just passive job listings.

The core idea: instead of the traditional "post a CV and hope" model, Jsoor guides candidates through profile building, skill tagging, assessments, and an AI interview simulator — giving companies richer signals beyond the CV.

---

## Core Differentiator

Unlike traditional job boards (LinkedIn, Bayt), Jsoor focuses on **structured matching** rather than passive listings:

- Candidates are evaluated on skills and assessments, not just CVs
- Companies see structured applicant pipelines with signal-rich profiles
- The hiring workflow is guided: apply → review → assess → decide

---

## Target Users

### Job Seekers (Primary)
Students and fresh graduates looking for internships or entry-level jobs.

**Pain points:**
- Lack of experience on a CV
- Unclear career direction
- Difficulty standing out

**How Jsoor helps:** Profile showcases skills, projects, certifications, and assessment results — not just a PDF.

### Companies (Secondary)
Organizations posting internships and entry-level roles who want structured pipelines and skill-based candidate evaluation.

---

## Market

| Attribute | Value |
|---|---|
| Primary market | Jordan |
| Target region | MENA |
| Long-term | Global |
| Language (MVP) | English only |
| Arabic / RTL | Post-MVP |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.1 (App Router, React 19) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (avatars, CVs) |
| Edge Functions | Supabase Edge Functions (Deno) |
| AI | OpenAI GPT-4o-mini (interview simulator) |
| Animation | Motion (Framer Motion v12) |
| Icons | Lucide React, React Icons |

---

## User Roles

| Role | Description |
|---|---|
| `job_seeker` | Students/graduates; browse jobs, apply, take assessments |
| `company` | Post jobs, review applicants, send assessments |
| `admin` | Platform moderator; approve jobs, oversee platform |

Role is stored in `profiles.role` and enforced in middleware + RLS.

---

## Project Context

| Attribute | Value |
|---|---|
| Type | Graduation project (production-minded MVP) |
| Academic deadline | ~1–2 months from project start |
| Post-launch intent | Continue as a real product after submission |
| Mindset | Not a demo — code quality, security, and UX matter |

---

## MVP Goal

A complete end-to-end hiring workflow:
1. Company posts a job (with required skills)
2. Job seeker applies (with optional cover letter)
3. Company views and manages applicants
4. Company sends an assessment to a shortlisted applicant
5. Applicant takes the assessment
6. Company reviews results and updates status
7. Applicant sees their status and results

This loop — creation to evaluation to decision — is the academic deliverable.
