# Feature: Assessments (V3)

**Status:** Done  
**Spec:** [`docs/07-specs/assessments.md`](../07-specs/assessments.md) · [`docs/07-specs/assessments-v2.md`](../07-specs/assessments-v2.md)

---

## What Was Built

### Question Types

Each question in the `questions` jsonb array has a `type` field:

```typescript
type Question =
  | {
      type: "open";
      question: string;
      points?: number;
      allowTextAnswer: boolean;
      allowUrlAnswer: boolean;
      allowFileUpload: boolean;
      requiredAnswerTypes?: ("text" | "url" | "file")[];
    }
  | { type: "mcq"; question: string; options: string[]; correct: number; points?: number }
  | { type: "multiselect"; question: string; options: string[]; correct: number[]; points?: number }
  | { type: "truefalse"; question: string; correct: boolean; points?: number }
```

The `correct` field is **never sent to the job seeker** — it stays server-side and is used for auto-scoring.

---

### Company Side

**Assessment builder** (`ApplicantDetailClient.tsx`):
- "Add Question" dropdown: Open Text / Multiple Choice / True or False
- MCQ: question text + 4 option inputs + radio to mark the correct answer
- True/False: question text + toggle for correct answer
- Multi-select: options + one or more correct answers
- Open response: configurable written text, link, and private file upload answer methods
- Every question has a positive integer point value; old questions without `points` count as 1
- Optional time limit field (minutes)
- Optional deadline

**Results view** (after applicant submits):
- Score displayed prominently (e.g. "72 / 100") — auto-calculated at submit time
- Per-question breakdown:
  - MCQ/T-F: applicant's answer highlighted green (correct) or red (incorrect); correct option also marked
  - Open response: text, submitted link, and private file download metadata
- "Release Results to Candidate" button → sets `results_released = true`
- Button changes to "Results Released ✓" after clicking

---

### Job Seeker Side

**Multi-step assessment flow** (`AssessmentsClient.tsx`):

1. **Instructions screen** — title, description, question count, time limit, "Start Assessment" button
2. **One question at a time** — progress bar, locked forward-only navigation
   - MCQ: option buttons (A/B/C/D)
   - True/False: two large buttons
   - Open response: textarea, URL input, and/or file picker depending on company configuration
3. **Timer** — countdown in top-right corner if `time_limit` is set; auto-submits at 0
4. **Confirmation screen** — "Assessment Submitted"; shows score if all questions were MCQ/T-F

**Results visibility:**
- Before release: "Your assessment has been submitted. Results will be shared by the company."
- After release: score + per-question breakdown with ✓/✗ indicators (correct answers are never revealed; only whether the answer was right or wrong)

---

### Auto-Scoring

Runs in `submitAssessment` server action at submission time:

```
score = (earned auto-gradable points / possible auto-gradable points) * 100
```

- MCQ, true/false, and multi-select are auto-graded using points
- Multi-select is correct only when the selected set exactly matches the correct set
- Open response questions are excluded from auto-scoring
- If all questions are open, `score` stays `null`
- Score is written to `assessments.score` alongside the submission

---

### Assessment Submission Files

Open response file uploads use the private Supabase Storage bucket `assessment-submissions`.

- The database JSON stores only the private storage path and file metadata.
- Job seekers upload to `{assessmentId}/{userId}/question-{index}/{timestamp}-{fileName}`.
- Companies request signed URLs through a server action that verifies company ownership and that the file path exists in the assessment submission.
- Files are limited to about 10MB and common practical formats: PDF, DOC, DOCX, PNG, JPG, JPEG, and ZIP.

---

### Authorization

- `submitAssessment` verifies `applicant_id === user.id` before writing
- `releaseAssessmentResults` verifies `company_id === user.id`
- `getMyAssessments` strips the `correct` field from all questions before returning data to the client; adds `isCorrect: boolean` per question only after `results_released = true`

---

## Key Files

| File | Role |
|---|---|
| `src/app/job-seeker/assessments/page.tsx` | Server component: fetches assessments, renders AssessmentsClient |
| `src/app/job-seeker/assessments/AssessmentsClient.tsx` | Multi-step flow: instructions → one question at a time → timer → confirmation |
| `src/app/company/applicants/[applicationId]/ApplicantDetailClient.tsx` | Company: question builder + per-question results view + release button |
| `lib/company/data.ts` → `getMyAssessments` | Fetches assessments for job seeker; strips `correct`, adds `isCorrect` post-release |
| `lib/company/data.ts` → `getAssessmentForApplication` | Fetches full assessment (with `correct`) for company view |
| `lib/company/actions.ts` → `sendAssessment` | Stores typed questions + time_limit |
| `lib/company/actions.ts` → `submitAssessment` | Auto-scores MCQ/TF, stores submission + score |
| `lib/company/actions.ts` → `releaseAssessmentResults` | Sets `results_released = true` |
| `lib/company/actions.ts` → `reviewAssessment` | Company adds feedback; manual score entry if all questions are open |
