"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import ScoreBadge from "@/components/interview-simulator/score";
import { OverallScore } from "@/components/interview-simulator/score";

async function generateQuestions(config: InterviewConfig): Promise<Question[]> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "generateQuestions", config }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function evaluateAnswers(
  config: InterviewConfig,
  questions: Question[],
  answers: Answer[]
): Promise<{ feedback: FeedbackItem[]; overallSummary: string }> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "evaluateAnswers", config, questions, answers }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// ─── Setup dialog ─────────────────────────────────────────────────────────────

function SetupDialog({
  onStart,
  trigger,
}: {
  onStart: (config: InterviewConfig) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [questionCount, setQuestionCount] = useState(5);

  const handleStart = () => {
    if (!jobTitle.trim() || !jobDescription.trim()) return;
    setOpen(false);
    onStart({ jobTitle: jobTitle.trim(), jobDescription: jobDescription.trim(), questionCount });
    // Reset
    setJobTitle("");
    setJobDescription("");
    setQuestionCount(5);
  };

  return (
    
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Interview Setup</DialogTitle>
          <DialogDescription>
            Enter the job title, description, and desired question count.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="job-title">Job Title</Label>
            <Input
              id="job-title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Product Manager"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="job-description">Job Description</Label>
            <Textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and goals…"
              rows={5}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="question-count">
              Number of Questions{" "}
              <span className="text-muted-foreground font-normal">({questionCount})</span>
            </Label>
            <input
              id="question-count"
              type="range"
              min={1}
              max={10}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>10</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleStart} disabled={!jobTitle.trim() || !jobDescription.trim()}>
            Start Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InterviewSimulatorPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [overallSummary, setOverallSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when a new question appears
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
    } catch (e) {
      setError("Failed to generate questions. Please check your connection and try again.");
      setPhase("idle");
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
      // Evaluate all answers
      setSubmitting(true);
      setPhase("feedback");
      try {
        const result = await evaluateAnswers(config!, questions, newAnswers);
        setFeedbackItems(result.feedback);
        setOverallSummary(result.overallSummary);
        setPhase("complete");
      } catch (e) {
        setError("Failed to evaluate answers. Your answers were recorded.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitAnswer();
  };

  const reset = () => {
    setPhase("idle");
    setConfig(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentAnswer("");
    setFeedbackItems([]);
    setOverallSummary("");
    setError(null);
    setCurrentIndex(0);
  };

  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  // ── Render ──

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Interview Simulator</h1>
          <p className="text-sm text-muted-foreground">
            {config
              ? `${config.jobTitle} · ${questions.length} questions`
              : "Start a new simulated interview by providing the job details."}
          </p>
        </div>

        <div className="flex gap-2">
          {phase !== "idle" && (
            <Button variant="outline" onClick={reset} size="sm">
              Reset
            </Button>
          )}
          <SetupDialog
            onStart={startInterview}
            trigger={
              <Button disabled={phase === "loading" || phase === "questioning" || submitting}>
                {phase === "idle" ? "New Interview" : "New Interview"}
              </Button>
            }
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {phase === "loading" && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Generating your interview questions…</p>
        </div>
      )}

      {/* Questioning */}
      {phase === "questioning" && questions.length > 0 && (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Question card */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <Badge variant="outline" className="mb-3 text-xs">
              Q{currentIndex + 1}
            </Badge>
            <p className="text-base font-medium leading-relaxed">
              {questions[currentIndex].text}
            </p>
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer here… (Cmd/Ctrl + Enter to submit)"
              rows={6}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Cmd/Ctrl + Enter to submit</p>
              <Button onClick={submitAnswer} disabled={!currentAnswer.trim()}>
                {currentIndex === questions.length - 1 ? "Finish Interview" : "Next Question"} →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluating */}
      {phase === "feedback" && submitting && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Evaluating your responses…</p>
        </div>
      )}

      {/* Results */}
      {phase === "complete" && feedbackItems.length > 0 && (
        <div className="space-y-6">
          <OverallScore feedbackItems={feedbackItems} />

          {overallSummary && (
            <div className="rounded-xl border bg-muted/40 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Overall Assessment
              </p>
              <p className="text-sm leading-relaxed">{overallSummary}</p>
            </div>
          )}

          <ScrollArea className="h-120 pr-3">
            <div className="space-y-4">
              {feedbackItems.map((item) => {
                const q = questions.find((q) => q.id === item.questionId);
                const a = answers.find((a) => a.questionId === item.questionId);
                return (
                  <div key={item.questionId} className="rounded-xl border bg-card p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-snug flex-1">{q?.text}</p>
                      <ScoreBadge score={item.score} />
                    </div>

                    {a?.text && (
                      <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground italic">
                        {a.text}
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
                          Strengths
                        </p>
                        <p className="text-muted-foreground leading-relaxed">{item.strengths}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                          To improve
                        </p>
                        <p className="text-muted-foreground leading-relaxed">{item.improvements}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="flex justify-center">
            <SetupDialog
              onStart={startInterview}
              trigger={<Button variant="outline">Start Another Interview</Button>}
            />
          </div>
        </div>
      )}

      {/* Idle state */}
      {phase === "idle" && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <div className="text-4xl">🎙️</div>
          <div>
            <p className="font-medium">No interview in progress</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click <span className="font-medium">New Interview</span> to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}