# Feature: AI Interview Simulator

**Status:** Done  
**Source:** Inferred from codebase.

---

## What's Implemented

Full end-to-end mock interview flow for job seekers.

### Flow

```
1. Setup
   └── Job seeker enters: job title, job description, interview type, difficulty, question count

2. Question Generation
   └── POST /api/ai → OpenAI (gpt-4o-mini) generates N questions

3. Interview Session
   └── Questions shown one at a time
   └── Job seeker types text answers
   └── Timer per question (configurable)

4. Evaluation
   └── POST /api/ai → OpenAI evaluates each answer
   └── Returns per-question: score (1–10), strengths, areas to improve

5. Results
   └── Overall summary feedback
   └── Score visualization (components/interview-simulator/score.tsx)
```

### Interview Types (from types file)
- Technical
- Behavioral
- Mixed

### Difficulty Levels
- Easy, Medium, Hard

## Files

| File | Purpose |
|---|---|
| `src/app/job-seeker/interview-simulator/page.tsx` | Full interview page (~600+ lines) |
| `src/app/api/ai/route.ts` | OpenAI API route (question gen + evaluation) |
| `components/interview-simulator/score.tsx` | Score display and feedback UI |
| `types/interview-simulator.ts` | Phase, question, feedback TypeScript types |

## Known Gaps

- Interview sessions are not persisted to the database
- No history of past interviews
- No ability to resume a session
