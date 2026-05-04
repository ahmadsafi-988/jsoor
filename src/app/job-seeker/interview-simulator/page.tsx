"use client";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import ScoreBadge, { OverallScore } from "@/components/interview-simulator/score";
import { ArrowRight, RotateCcw } from "lucide-react";
import SetupForm from "@/components/interview-simulator/form";
import { createClient } from "@/lib/supabase/client";

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
  const [sessionId, setSessionId]       = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

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
    setSessionId(null);

    try {
      const qs = await generateQuestions(cfg);
      setQuestions(qs);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated");

      const { data: session, error: insertError } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: user.id,
          job_title: cfg.jobTitle,
          job_description: cfg.jobDescription,
          interview_type: cfg.interviewType,
          level: cfg.level,
          question_count: cfg.questionCount,
          config: cfg,
          status: "In progress",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      setSessionId(session.id);
      setPhase("questioning");
    } catch (err) {
      console.error("Error starting interview:", err);
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
      return;
    }

    setSubmitting(true);
    setPhase("feedback");

    try {
      const result = await evaluateAnswers(config!, questions, newAnswers);
      setFeedbackItems(result.feedback);
      setOverallSummary(result.overallSummary);

      if (!sessionId) throw new Error("Session ID is missing");

      const answersToInsert = newAnswers.map((answer, index) => ({
        session_id: sessionId,
        question_index: index,
        question_text: questions[index].text,
        answer_text: answer.text,
        score: result.feedback.find((f) => f.questionId === answer.questionId)?.score ?? null,
        strengths: result.feedback.find((f) => f.questionId === answer.questionId)?.strengths ?? null,
        improvements: result.feedback.find((f) => f.questionId === answer.questionId)?.improvements ?? null,
      }));

      const { error: answersError } = await supabase
        .from("interview_questions")
        .insert(answersToInsert);
      if (answersError) throw answersError;

      const avgScore = result.feedback.reduce((sum, f) => sum + f.score, 0) / result.feedback.length;
      const { error: updateError } = await supabase
        .from("interview_sessions")
        .update({
          overall_score: avgScore,
          overall_summary: result.overallSummary,
          status: "completed",
        })
        .eq("id", sessionId);
      if (updateError) throw updateError;

      setPhase("complete");
    } catch (err) {
      console.error("Error evaluating answers:", err);
      setError("Failed to evaluate answers.");
      setPhase("setup");
    } finally {
      setSubmitting(false);
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
    setSessionId(null);
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
          
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#3d4a41] border border-[#bccabe] rounded-xl hover:bg-[#f6f3f2] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          
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
