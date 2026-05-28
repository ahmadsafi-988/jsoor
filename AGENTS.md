# AGENTS.md — JSOOR Project Instructions

## Project Overview

JSOOR is a graduation project web platform that connects entry-level job seekers with companies looking for junior talent and interns.

The platform has three main roles:

1. Job Seeker
2. Company / Employer
3. Administrator

Core modules include:

- Authentication and role-based dashboards
- Job seeker profile management
- Company profile management
- Job opportunities
- Applications and application status tracking
- Rule-based matching score
- Task-based assessments
- AI interview simulator
- Messaging and notifications
- Admin management and moderation

## UI / UX Rules

- Keep the design consistent with the existing project.
- Before creating new components, inspect the existing components, layouts, styles, and naming conventions.
- Reuse existing UI components whenever possible.
- Do not introduce a completely different design style.
- Pages should feel modern, clean, readable, and dashboard-oriented.
- Prefer simple cards, tables, forms, filters, and status badges.
- Keep text clear and student-friendly.

## Engineering Rules

- First inspect the current codebase before making changes.
- Do not assume the architecture.
- Follow the existing file structure.
- Follow the existing naming conventions.
- Do not add new production dependencies unless necessary.
- If a dependency is needed, explain why before adding it.
- Keep changes small and focused on the current ticket.
- Do not rewrite unrelated files.
- Do not refactor large parts of the project unless the ticket requires it.
- Avoid overengineering.

## Next.js Rules

- Respect whether the project uses App Router or Pages Router.
- Use Server Components and Client Components correctly.
- Add "use client" only when interactivity, hooks, or browser APIs are needed.
- Keep data fetching patterns consistent with the existing project.
- Do not expose secrets or environment variables to the client.
- Use TypeScript types where the project already uses TypeScript.

## Authentication / Roles

- Respect role-based access.
- Job seeker pages should not expose company/admin functionality.
- Company pages should not expose job seeker/admin functionality.
- Admin pages should be protected and management-focused.

## Data and Backend Rules

- Before editing database logic, inspect the existing schema/models/API routes.
- Keep validation consistent.
- Do not change database schema unless the ticket requires it.
- If schema changes are needed, explain the migration impact.
- Do not fake backend behavior unless the current project already uses mock data.
- If using mock data temporarily, clearly mark it as temporary.

## JSOOR Functional Scope Reference

Use these project requirements as the source of truth:

- Job seekers can register, log in, manage profile, browse opportunities, apply, track applications, access assessments, use interview simulator, and join communities.
- Companies can register, manage company profile, post opportunities, review applicants, update application status, create assessments, assign assessments, evaluate submissions, and participate in communities.
- Admins can manage users, approve/reject companies, ban/warn users, and moderate communities.
- The system includes notifications, messaging, matching score, and community features.

## Task Execution Process

For every ticket:

1. Understand the ticket.
2. Inspect related files first.
3. Briefly explain the plan.
4. Make the smallest correct implementation.
5. Run lint/build/tests if available.
6. Summarize changed files.
7. Mention anything that still needs manual testing.

## Done Means

A task is done only when:

- The requested feature works.
- The UI matches the existing project style.
- No unrelated files were changed.
- TypeScript/lint/build errors are checked where possible.
- The implementation respects JSOOR roles and project scope.

## Important Constraint

This is a graduation project, so clarity and consistency are more important than adding complex features quickly.
