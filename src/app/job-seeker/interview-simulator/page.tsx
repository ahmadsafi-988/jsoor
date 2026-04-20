"use client";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import ScoreBadge, { OverallScore } from "@/components/interview-simulator/score";
import { ArrowRight, Lightbulb, RotateCcw, Rocket } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InterviewConfig = {
  jobTitle: string;
  jobDescription: string;
  questionCount: number;
};

type Phase = "setup" | "loading" | "questioning" | "feedback" | "complete";

type Question  = { id: number; text: string };
type Answer    = { questionId: number; text: string };
type FeedbackItem = { questionId: number; score: number; strengths: string; improvements: string };

// ─── API helpers (unchanged) ──────────────────────────────────────────────────

async function generateQuestions(config: InterviewConfig): Promise<Question[]> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "generateQuestions", config }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function evaluateAnswers(
  config: InterviewConfig,
  questions: Question[],
  answers: Answer[]
): Promise<{ feedback: FeedbackItem[]; overallSummary: string }> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "evaluateAnswers", config, questions, answers }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── Setup Form (Stitch design) ───────────────────────────────────────────────

const RECENT_SETUPS = [
  { label: "Frontend Architecture", sub: "Senior · Technical" },
  { label: "Behavioral Panel",      sub: "Mid-Level · STAR Method" },
];

const INTERVIEW_TYPES = [
  "Technical / Coding",
  "System Design",
  "Behavioral (STAR Method)",
  "Mixed Panel",
];
const DIFFICULTY_LEVELS = [
  "Entry Level / Graduate",
  "Mid-Level",
  "Senior / Lead",
  "Principal / Staff",
];

function SetupForm({ onStart }: { onStart: (cfg: InterviewConfig) => void }) {
  const [role, setRole]           = useState("");
  const [skills, setSkills]       = useState("");
  const [iType, setIType]         = useState(INTERVIEW_TYPES[0]);
  const [difficulty, setDiff]     = useState(DIFFICULTY_LEVELS[1]);
  const [count]                   = useState(5);

  const handleStart = () => {
    if (!role.trim()) return;
    const jobDescription = `Skills: ${skills || "General"}\nType: ${iType}\nLevel: ${difficulty}`;
    onStart({ jobTitle: role.trim(), jobDescription, questionCount: count });
  };

  const fillPreset = (label: string) => {
    setRole(label.split(" ")[0] + " Role");
    setSkills(label.includes("Frontend") ? "React, TypeScript, System Architecture" : "Communication, Leadership");
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full flex flex-col">
      {/* Page header */}
      <div className="mb-10 flex flex-col gap-2">
        <h2 className="font-headline text-[2.5rem] font-bold text-[#1c1b1b] tracking-tight leading-tight">
          Set Up Your Mock Interview
        </h2>
        <p className="text-[#3d4a41] text-base max-w-2xl leading-relaxed">
          Configure your AI-driven simulator. Tailor the environment to your
          target role to experience a realistic, high-pressure interview scenario.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Main form ──────────────────────────────────────────── */}
        <div className="lg:col-span-8 bg-white rounded-[1.5rem] p-8 md:p-10 flex flex-col gap-8 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#78fbb6] rounded-full mix-blend-multiply filter blur-[100px] opacity-20 pointer-events-none" />

          <div className="flex flex-col gap-8 relative z-10">
            {/* Role */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wider">
                Target Role
              </label>
              <div className="relative bg-[#f6f3f2] rounded-t-lg rounded-b-none border-b-2 border-[#e5e2e1] focus-within:border-[#006d43] transition-colors">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3d4a41] opacity-60 text-lg">💼</span>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-[#1c1b1b] text-sm placeholder:text-[#3d4a41]/40 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wider">
                Key Technologies &amp; Skills
              </label>
              <div className="relative bg-[#f6f3f2] rounded-t-lg rounded-b-none border-b-2 border-[#e5e2e1] focus-within:border-[#006d43] transition-colors">
                <span className="absolute left-4 top-4 text-[#3d4a41] opacity-60 text-lg">💻</span>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, TypeScript, System Architecture, Performance Tuning..."
                  rows={3}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-[#1c1b1b] text-sm placeholder:text-[#3d4a41]/40 focus:ring-0 focus:outline-none resize-none"
                />
              </div>
              <p className="text-xs text-[#3d4a41]/60 pl-2">Separate skills with commas.</p>
            </div>

            {/* Interview type + difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wider">
                  Interview Type
                </label>
                <div className="relative bg-[#f6f3f2] rounded-t-lg rounded-b-none border-b-2 border-[#e5e2e1] focus-within:border-[#006d43] transition-colors">
                  <select
                    value={iType}
                    onChange={(e) => setIType(e.target.value)}
                    className="w-full bg-transparent border-none py-4 pl-4 pr-10 text-[#1c1b1b] text-sm appearance-none focus:ring-0 focus:outline-none cursor-pointer"
                  >
                    {INTERVIEW_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3d4a41] pointer-events-none text-xs">▾</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wider">
                  Difficulty Level
                </label>
                <div className="relative bg-[#f6f3f2] rounded-t-lg rounded-b-none border-b-2 border-[#e5e2e1] focus-within:border-[#006d43] transition-colors">
                  <select
                    value={difficulty}
                    onChange={(e) => setDiff(e.target.value)}
                    className="w-full bg-transparent border-none py-4 pl-4 pr-10 text-[#1c1b1b] text-sm appearance-none focus:ring-0 focus:outline-none cursor-pointer"
                  >
                    {DIFFICULTY_LEVELS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3d4a41] pointer-events-none text-xs">▾</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-2 pt-6 border-t border-[#e5e2e1] flex justify-end">
              <button
                onClick={handleStart}
                disabled={!role.trim()}
                className="hero-gradient-bg text-white font-semibold text-base py-4 px-10 rounded-xl hover:brightness-110 shadow-[0_20px_40px_rgba(0,108,67,0.15)] transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <span>Initialize Simulator</span>
                <Rocket className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Info panel ─────────────────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Pro tip */}
          <div className="bg-[#e5e2e1] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#006d43] rounded-l-2xl" />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shrink-0 text-[#006d43]">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline text-base font-bold text-[#1c1b1b] mb-2">
                  Pro-Tip for System Design
                </h3>
                <p className="text-sm text-[#3d4a41] leading-relaxed">
                  Include specific constraints in the Skills section (e.g.,
                  "High throughput, Low latency, Microservices") to make the
                  AI challenge your architecture choices.
                </p>
              </div>
            </div>
          </div>

          {/* Recent setups */}
          <div className="bg-[#f6f3f2] rounded-2xl p-6">
            <h3 className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wider mb-4">
              Recent Setups
            </h3>
            <div className="flex flex-col gap-3">
              {RECENT_SETUPS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => fillPreset(s.label)}
                  className="w-full text-left bg-white hover:bg-white/80 rounded-xl p-4 transition-colors flex items-center justify-between border border-[#bccabe]/20 group"
                >
                  <div>
                    <p className="font-semibold text-[#1c1b1b] text-sm group-hover:text-[#006d43] transition-colors">
                      {s.label}
                    </p>
                    <p className="text-xs text-[#3d4a41] mt-0.5">{s.sub}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#6d7a70] group-hover:text-[#006d43]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InterviewSimulatorPage() {
  const [phase, setPhase]               = useState<Phase>("setup");
  const [config, setConfig]             = useState<InterviewConfig | null>(null);
  const [questions, setQuestions]       = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]           = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [overallSummary, setOverallSummary] = useState("");
  const [error, setError]               = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (phase === "questioning") textareaRef.current?.focus();
  }, [currentIndex, phase]);

  const startInterview = async (cfg: InterviewConfig) => {
    setConfig(cfg);
    setPhase("loading");
    setError(null);
    setAnswers([]);
    setCurrentIndex(0);
    setCurrentAnswer("");
    setFeedbackItems([]);
    setOverallSummary("");
    try {
      const qs = await generateQuestions(cfg);
      setQuestions(qs);
      setPhase("questioning");
    } catch {
      setError("Failed to generate questions. Please check your connection and try again.");
      setPhase("setup");
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return;
    const newAnswers = [
      ...answers,
      { questionId: questions[currentIndex].id, text: currentAnswer.trim() },
    ];
    setAnswers(newAnswers);
    setCurrentAnswer("");
    const isLast = currentIndex === questions.length - 1;
    if (!isLast) {
      setCurrentIndex((i) => i + 1);
    } else {
      setSubmitting(true);
      setPhase("feedback");
      try {
        const result = await evaluateAnswers(config!, questions, newAnswers);
        setFeedbackItems(result.feedback);
        setOverallSummary(result.overallSummary);
        setPhase("complete");
      } catch {
        setError("Failed to evaluate answers.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitAnswer();
  };

  const reset = () => {
    setPhase("setup");
    setConfig(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentAnswer("");
    setFeedbackItems([]);
    setOverallSummary("");
    setError(null);
    setCurrentIndex(0);
  };

  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  // Setup phase — full Stitch design
  if (phase === "setup") {
    return (
      <>
        {error && (
          <div className="mx-8 mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        <SetupForm onStart={startInterview} />
      </>
    );
  }

  // Loading
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006d43] border-t-transparent" />
        <p className="text-sm text-[#3d4a41]">Generating your interview questions…</p>
      </div>
    );
  }

  // Q&A phases — keep existing layout but re-skinned
  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="font-headline text-2xl font-bold text-[#1c1b1b] tracking-tight">
            Interview Simulator
          </h1>
          <p className="text-sm text-[#3d4a41] mt-0.5">
            {config ? `${config.jobTitle} · ${questions.length} questions` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {phase !== "setup" && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#3d4a41] border border-[#bccabe] rounded-xl hover:bg-[#f6f3f2] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Questioning */}
      {phase === "questioning" && questions.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#3d4a41]">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="h-1.5 w-full bg-[#e5e2e1] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#006d43] to-[#00a86b] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <Badge variant="outline" className="mb-3 text-xs border-[#bccabe] text-[#3d4a41]">
              Q{currentIndex + 1}
            </Badge>
            <p className="text-base font-medium text-[#1c1b1b] leading-relaxed">
              {questions[currentIndex].text}
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer here… (Cmd/Ctrl + Enter to submit)"
              rows={6}
              className="w-full bg-[#f6f3f2] border border-[#e5e2e1] rounded-xl p-4 text-sm text-[#1c1b1b] placeholder:text-[#3d4a41]/50 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#3d4a41]/60">Cmd/Ctrl + Enter to submit</p>
              <button
                onClick={submitAnswer}
                disabled={!currentAnswer.trim()}
                className="hero-gradient-bg text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {currentIndex === questions.length - 1 ? "Finish Interview" : "Next Question"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluating */}
      {phase === "feedback" && submitting && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006d43] border-t-transparent" />
          <p className="text-sm text-[#3d4a41]">Evaluating your responses…</p>
        </div>
      )}

      {/* Results */}
      {phase === "complete" && feedbackItems.length > 0 && (
        <div className="space-y-6">
          <OverallScore feedbackItems={feedbackItems} />

          {overallSummary && (
            <div className="rounded-2xl border border-[#e5e2e1] bg-[#f6f3f2] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#3d4a41] mb-2">
                Overall Assessment
              </p>
              <p className="text-sm text-[#1c1b1b] leading-relaxed">{overallSummary}</p>
            </div>
          )}

          <ScrollArea className="h-120 pr-3">
            <div className="space-y-4">
              {feedbackItems.map((item) => {
                const q = questions.find((q) => q.id === item.questionId);
                const a = answers.find((a) => a.questionId === item.questionId);
                return (
                  <div
                    key={item.questionId}
                    className="rounded-2xl border border-[#e5e2e1] bg-white p-5 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-[#1c1b1b] leading-snug flex-1">{q?.text}</p>
                      <ScoreBadge score={item.score} />
                    </div>
                    {a?.text && (
                      <div className="rounded-xl bg-[#f6f3f2] px-4 py-3 text-sm text-[#3d4a41] italic">
                        {a.text}
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Strengths</p>
                        <p className="text-[#3d4a41] leading-relaxed">{item.strengths}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">To improve</p>
                        <p className="text-[#3d4a41] leading-relaxed">{item.improvements}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex justify-center">
            <button
              onClick={reset}
              className="px-8 py-3 text-sm font-semibold text-[#006d43] border border-[#006d43] rounded-xl hover:bg-[#006d43] hover:text-white transition-colors"
            >
              Start Another Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
