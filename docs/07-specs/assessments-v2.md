# Spec: Assessments V2 — Professional Assessment Experience

**Priority:** 8  
**Status:** Implemented  
**Source:** Confirmed by user.

---

## Goal

Make assessments feel like a real hiring tool — not a basic form. Companies should be able to build structured tests with mixed question types. Job seekers should experience a focused, timed, one-question-at-a-time flow.

---

## What Already Exists (Do Not Rebuild)

- `assessments` table with `questions` (jsonb), `submission` (jsonb), `score`, `status`
- `createAssessment`, `submitAssessment` server actions
- Company sends assessment from applicant detail page
- Job seeker sees and submits assessments from their dashboard

---

## Changes Required

---

### 1. Question Types

Each question in the `questions` jsonb array gets a `type` field:

```typescript
type Question =
  | { type: "open";     question: string }
  | { type: "mcq";      question: string; options: string[]; correct: number }
  | { type: "truefalse"; question: string; correct: boolean }
```

**`correct` is never sent to the job seeker** — it stays server-side only and is used for auto-scoring on submission.

The `submission` jsonb stores answers keyed by question index:

```typescript
type Submission = {
  answers: Record<number, string | number | boolean>;
  submitted_at: string;
}
```

---

### 2. Auto-Scoring on Submit

When `submitAssessment` runs, it calculates a score automatically for MCQ and True/False questions:

```
score = (number of correct answers / total scorable questions) * 100
```

Open-ended questions are excluded from auto-scoring (require manual review).

If all questions are open-ended, `score` stays `null`.

The `status` moves from `pending` → `submitted`. Score is written at submit time.

---

### 3. Assessment Builder (Company Side)

**File:** `src/app/company/applicants/[applicationId]/ApplicantDetailClient.tsx`

Replace the current simple question list with a proper builder:

- "Add Question" button shows a dropdown: **Open Text / Multiple Choice / True or False**
- **Open Text:** just a question field (same as today)
- **Multiple Choice:** question field + 2–4 option fields + radio to mark the correct answer
- **True / False:** question field + toggle for correct answer (True / False)
- Questions can be reordered (drag) or deleted
- Time limit field (minutes) added to the assessment form — optional, `null` means no limit

The `questions` array stored in DB includes the `correct` field — it is the source of truth for scoring.

---

### 4. Assessment-Taking UI (Job Seeker Side)

**File:** `src/app/job-seeker/assessments/AssessmentsClient.tsx`

Replace the current expand-and-answer form with a focused flow:

#### Step 1 — Instructions Screen
Shown before the job seeker starts. Displays:
- Assessment title and description
- Number of questions
- Time limit (if set)
- "Start Assessment" button — clicking starts the timer

#### Step 2 — One Question at a Time
- Shows one question at a time with a **progress bar** (e.g. "Question 2 of 6")
- **Open text:** textarea
- **MCQ:** radio buttons for each option (no correct answer shown)
- **True / False:** two buttons — True / False
- "Next" button advances; "Previous" button goes back (answers preserved)
- Last question shows "Submit" instead of "Next"

#### Step 3 — Timer
- If the assessment has a time limit, a countdown timer is shown in the top-right corner
- When it reaches 0, the assessment auto-submits with whatever answers are filled in
- Timer state is kept in React state (not persisted — if page is refreshed, timer restarts)

#### Step 4 — Confirmation Screen
After submit:
- "Assessment submitted successfully"
- Shows score if all questions were auto-gradable (MCQ/T-F only)
- "Back to Assessments" button

---

### 5. Company Results View

**File:** `src/app/company/applicants/[applicationId]/ApplicantDetailClient.tsx`

Update the assessment results section to show:
- Score prominently (e.g. "72 / 100")
- Per-question breakdown:
  - Question text
  - Applicant's answer
  - For MCQ/T-F: ✓ Correct / ✗ Incorrect + what the correct answer was
  - For open text: just the answer (no correct/incorrect indicator)

---

## Database Changes

No schema changes needed. The existing `questions` (jsonb) and `submission` (jsonb) fields are flexible enough. Only the shape of the data stored changes.

Two new columns on `assessments`:

```sql
alter table assessments add column if not exists time_limit integer default null;
alter table assessments add column if not exists results_released boolean default false;
```

---

## Files to Change

| File | Change |
|---|---|
| `src/app/company/applicants/[applicationId]/ApplicantDetailClient.tsx` | Replace question builder + results view |
| `src/app/job-seeker/assessments/AssessmentsClient.tsx` | Replace with multi-step assessment flow |
| `lib/company/actions.ts` → `submitAssessment` | Add auto-scoring logic |
| `lib/company/actions.ts` → `releaseAssessmentResults` | New server action — sets `results_released = true` |
| `lib/supabase_generated_types.ts` | Add `time_limit` + `results_released` columns to `assessments` type (after migration) |

---

## Implementation Order

1. Run DB migration to add `time_limit` column
2. Update `submitAssessment` to auto-score MCQ and T-F questions
3. Build new assessment builder in `ApplicantDetailClient`
4. Build new assessment-taking flow in `AssessmentsClient`
5. Update company results view to show per-question breakdown

---

## Confirmed Decisions

1. **Navigation:** One-way — once a question is answered and "Next" is clicked, it is locked. No going back.
2. **Score visibility:** Only the company sees the score by default. Company can click **"Release Results"** after reviewing — this sets `results_released = true` on the assessment row, which unlocks the score + per-question breakdown for the job seeker.
3. **Max questions:** No limit.

---

## Results Release Flow

**Company side:**
- After reviewing, a "Release Results to Candidate" button appears
- Clicking it calls a `releaseAssessmentResults` server action that sets `results_released = true`
- Button changes to "Results Released ✓" (disabled)

**Job seeker side:**
- Before release: "Your assessment has been submitted. Results will be shared by the company."
- After release: shows score + per-question breakdown (correct/incorrect for MCQ/T-F, answer text for open)

**DB change:** add `results_released boolean default false` to `assessments` table.
