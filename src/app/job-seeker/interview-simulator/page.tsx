"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ScoreBadge, { OverallScore } from "@/components/interview-simulator/score";
import { ArrowRight, RotateCcw, Mic, MicOff, Loader2 } from "lucide-react";
import SetupForm, { type PreviousInterview } from "@/components/interview-simulator/form";
import InterviewAvatar from "@/components/interview-simulator/Avatar";
import { createClient } from "@/lib/supabase/client";
import { useTTS, type AvatarState } from "@/hooks/use-tts";
import { useWhisper } from "@/hooks/use-whisper";
import type { Json } from "@/lib/supabase_generated_types";

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

interface PreviousInterviewAnswer {
  id: string;
  questionIndex: number;
  questionText: string;
  answerText: string;
  score: number | null;
  strengths: string | null;
  improvements: string | null;
}

function jsonToText(value: Json | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => jsonToText(item)).filter(Boolean).join(", ");
  return Object.values(value).map((item) => jsonToText(item)).filter(Boolean).join(", ");
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
  const [avatarState, setAvatarState]   = useState<AvatarState>("idle");
  const [previousInterviews, setPreviousInterviews] = useState<PreviousInterview[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<PreviousInterview | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<PreviousInterviewAnswer[]>([]);

  const supabase = useMemo(() => createClient(), []);

  const fetchPreviousInterviews = useCallback(async () => {
    setHistoryLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setPreviousInterviews([]);
        return;
      }

      const { data, error: sessionsError } = await supabase
        .from("interview_sessions")
        .select("id, job_title, interview_type, level, question_count, status, overall_score, overall_summary, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      setPreviousInterviews(
        (data ?? []).map((session) => ({
          id: session.id,
          jobTitle: session.job_title,
          interviewType: session.interview_type,
          level: session.level,
          questionCount: session.question_count,
          status: session.status,
          overallScore: session.overall_score,
          overallSummary: session.overall_summary,
          createdAt: session.created_at ?? new Date().toISOString(),
        }))
      );
    } catch (err) {
      console.error("Error loading previous interviews:", err);
      setPreviousInterviews([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [supabase]);

  const openInterviewDetails = useCallback(async (interview: PreviousInterview) => {
    setSelectedInterview(interview);
    setSelectedAnswers([]);
    setDetailError(null);
    setDetailLoading(true);
    setDetailOpen(true);

    try {
      const { data, error: questionsError } = await supabase
        .from("interview_questions")
        .select("id, question_index, question_text, answer_text, score, strengths, improvements")
        .eq("session_id", interview.id)
        .order("question_index", { ascending: true });

      if (questionsError) throw questionsError;

      setSelectedAnswers(
        (data ?? []).map((item) => ({
          id: item.id,
          questionIndex: item.question_index,
          questionText: item.question_text,
          answerText: item.answer_text,
          score: item.score,
          strengths: jsonToText(item.strengths),
          improvements: jsonToText(item.improvements),
        }))
      );
    } catch (err) {
      console.error("Error loading interview details:", err);
      setDetailError("Failed to load interview details.");
    } finally {
      setDetailLoading(false);
    }
  }, [supabase]);

  // ── TTS hook ──────────────────────────────────────────────────────────────
  const { speak, stop: stopTTS, preload, audioLevel } = useTTS(setAvatarState);

  // ── Whisper hook ──────────────────────────────────────────────────────────
  const { isRecording, isTranscribing, toggleRecording } = useWhisper({
    onTranscript: (text, meta) => {
      setCurrentAnswer(text);
      setAvatarState(meta?.isFinal === false ? "listening" : "idle");
    },
    onStateChange: (recording) => {
      setAvatarState(recording ? "listening" : "idle");
    },
  });

  useEffect(() => {
    void fetchPreviousInterviews();
  }, [fetchPreviousInterviews]);

  // ── Speak question whenever currentIndex changes ───────────────────────────
  useEffect(() => {
    if (phase === "questioning" && questions.length > 0) {
      speak(questions[currentIndex].text);
    }
  }, [currentIndex, phase, questions, speak]);

  useEffect(() => {
    if (questions.length > 1) {
      void preload(questions.slice(1).map((question) => question.text));
    }
  }, [questions, preload]);

  // ── Start interview ────────────────────────────────────────────────────────
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
    setAvatarState("idle");

    try {
      const qs = await generateQuestions(cfg);
      setQuestions(qs);
      const firstQuestionAudio = qs[0] ? preload(qs[0].text) : Promise.resolve();

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
          config: cfg as unknown as Json,
          status: "In progress",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      await firstQuestionAudio;
      setSessionId(session.id);
      setPhase("questioning");
    } catch (err) {
      console.error("Error starting interview:", err);
      setError("Failed to generate questions. Please check your connection and try again.");
      setPhase("setup");
    }
  };

  // ── Submit answer ──────────────────────────────────────────────────────────
  const submitAnswer = useCallback(async () => {
    if (!currentAnswer.trim()) return;

    // Stop mic/TTS before moving on
    if (isRecording) toggleRecording();
    stopTTS();
    setAvatarState("thinking");

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

      await supabase.from("interview_questions").insert(answersToInsert);

      const avgScore = result.feedback.reduce((sum, f) => sum + f.score, 0) / result.feedback.length;
      await supabase.from("interview_sessions")
        .update({ overall_score: avgScore, overall_summary: result.overallSummary, status: "completed" })
        .eq("id", sessionId);

      await fetchPreviousInterviews();
      setAvatarState("idle");
      setPhase("complete");
    } catch (err) {
      console.error("Error evaluating answers:", err);
      setError("Failed to evaluate answers.");
      setPhase("setup");
    } finally {
      setSubmitting(false);
    }
  }, [currentAnswer, isRecording, answers, questions, currentIndex, config, sessionId, toggleRecording, stopTTS, supabase, fetchPreviousInterviews]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    if (isRecording) toggleRecording();
    stopTTS();
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
    setAvatarState("idle");
  };

  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <>
        {error && (
          <div className="mx-8 mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        <SetupForm
          onStart={startInterview}
          previousInterviews={previousInterviews}
          historyLoading={historyLoading}
          onInterviewSelect={openInterviewDetails}
        />
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-h-[86vh] overflow-hidden sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-[#1c1b1b]">
                {selectedInterview?.jobTitle ?? "Interview details"}
              </DialogTitle>
              <DialogDescription>
                {selectedInterview
                  ? `${selectedInterview.interviewType} · ${selectedInterview.questionCount} questions · ${new Intl.DateTimeFormat("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(selectedInterview.createdAt))}`
                  : "Full interview details"}
              </DialogDescription>
            </DialogHeader>

            {selectedInterview && (
              <div className="grid gap-3 rounded-2xl border border-[#e5e2e1] bg-[#f6f3f2] p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#3d4a41]">Level</p>
                  <p className="mt-1 text-sm font-semibold text-[#1c1b1b]">{selectedInterview.level}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#3d4a41]">Status</p>
                  <p className="mt-1 text-sm font-semibold text-[#1c1b1b]">{selectedInterview.status}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#3d4a41]">Score</p>
                  <p className="mt-1 text-sm font-semibold text-[#1c1b1b]">
                    {selectedInterview.overallScore === null ? "Pending" : `${selectedInterview.overallScore.toFixed(1)}/10`}
                  </p>
                </div>
              </div>
            )}

            {selectedInterview?.overallSummary && (
              <div className="rounded-2xl border border-[#e5e2e1] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#3d4a41]">Overall Assessment</p>
                <p className="mt-2 text-sm leading-relaxed text-[#1c1b1b]">{selectedInterview.overallSummary}</p>
              </div>
            )}

            <ScrollArea className="h-[48vh] pr-3">
              {detailLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="h-32 animate-pulse rounded-2xl bg-[#f6f3f2]" />
                  ))}
                </div>
              ) : detailError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {detailError}
                </div>
              ) : selectedAnswers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#bccabe] bg-[#f6f3f2] p-5 text-sm text-[#3d4a41]">
                  No saved answers were found for this interview.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedAnswers.map((answer) => (
                    <div
                      key={answer.id}
                      className="rounded-2xl border border-[#e5e2e1] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge variant="outline" className="mb-2 text-xs border-[#bccabe] text-[#3d4a41]">
                            Q{answer.questionIndex + 1}
                          </Badge>
                          <p className="text-sm font-semibold leading-relaxed text-[#1c1b1b]">
                            {answer.questionText}
                          </p>
                        </div>
                        {answer.score !== null && <ScoreBadge score={answer.score} />}
                      </div>

                      <div className="mt-4 rounded-xl bg-[#f6f3f2] px-4 py-3 text-sm italic leading-relaxed text-[#3d4a41]">
                        {answer.answerText || "No answer saved."}
                      </div>

                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Strengths</p>
                          <p className="mt-1 leading-relaxed text-[#3d4a41]">{answer.strengths || "No strengths saved."}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">To improve</p>
                          <p className="mt-1 leading-relaxed text-[#3d4a41]">{answer.improvements || "No improvements saved."}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006d43] border-t-transparent" />
        <p className="text-sm text-[#3d4a41]">Generating your interview questions...</p>
      </div>
    );
  }

  // ── Q&A + Feedback ────────────────────────────────────────────────────────
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
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#3d4a41] border border-[#bccabe] rounded-xl hover:bg-[#f6f3f2] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Questioning ── */}
      {phase === "questioning" && questions.length > 0 && (
        <div className="space-y-6">
          {/* Progress */}
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

          {/* Avatar + question card */}
          <div className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center gap-6">
            <InterviewAvatar state={avatarState} name="Saleh" audioLevel={audioLevel} />

            <div className="w-full">
              <Badge variant="outline" className="mb-3 text-xs border-[#bccabe] text-[#3d4a41]">
                Q{currentIndex + 1}
              </Badge>
              <p className="text-base font-medium text-[#1c1b1b] leading-relaxed text-center">
                {questions[currentIndex].text}
              </p>
            </div>
          </div>

          {/* Voice input area */}
          <div className="rounded-2xl border border-[#e5e2e1] bg-[#f6f3f2] p-5 space-y-4">
            {/* Transcript preview */}
            <div className="min-h-[72px] text-sm text-[#1c1b1b] leading-relaxed">
              {currentAnswer
                ? currentAnswer
                : (
                  <span className="text-[#3d4a41]/50 italic">
                    {isTranscribing
                      ? "Finalizing transcript..."
                      : isRecording
                        ? "Recording... speak your answer"
                        : "Press the mic to start answering"}
                  </span>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3">
              {/* Mic button */}
              <button
                onClick={toggleRecording}
                disabled={avatarState === "speaking" || avatarState === "preparing" || isTranscribing}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${isRecording
                    ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                    : "bg-white border border-[#bccabe] text-[#3d4a41] hover:bg-[#006d43] hover:text-white hover:border-[#006d43]"
                  }
                  disabled:opacity-40 disabled:cursor-not-allowed
                `}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isTranscribing ? "Finalizing" : isRecording ? "Stop recording" : "Start recording"}
              </button>

              {/* Submit */}
              <button
                onClick={submitAnswer}
                disabled={!currentAnswer.trim() || isRecording || avatarState === "speaking" || avatarState === "preparing" || isTranscribing}
                className="hero-gradient-bg text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLastQuestion ? "Finish Interview" : "Next Question"}
                {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-[#3d4a41]/50 text-center">
              You can also edit your transcribed answer before submitting
            </p>
          </div>

          {/* Editable transcript fallback */}
          {currentAnswer && (
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              rows={3}
              placeholder="Edit your transcribed answer if needed..."
              className="w-full bg-white border border-[#e5e2e1] rounded-xl p-4 text-sm text-[#1c1b1b] placeholder:text-[#3d4a41]/40 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
            />
          )}
        </div>
      )}

      {/* ── Evaluating ── */}
      {phase === "feedback" && submitting && (
        <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
          <InterviewAvatar state="thinking" name="Saleh" />
          <div>
            <p className="text-base font-semibold text-[#1c1b1b]">Reviewing your answers...</p>
            <p className="text-sm text-[#3d4a41] mt-1">Saleh is preparing your feedback</p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
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
