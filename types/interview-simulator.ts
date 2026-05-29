
// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "setup" | "loading" | "questioning" | "feedback" | "complete";

interface Question {
  id: number;
  text: string;
}

interface Answer {
  questionId: number;
  text: string;
}

interface FeedbackItem {
  questionId: number;
  score: number; // 1–10
  strengths: string;
  improvements: string;
}

interface InterviewConfig {
  jobTitle: string;
  jobDescription: string;
  questionCount: number;
  interviewType: string;
  level: string;
}

