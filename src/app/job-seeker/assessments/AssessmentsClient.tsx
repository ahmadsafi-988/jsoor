"use client";

import { useEffect, useRef, useState } from "react";
import { submitAssessment } from "@/lib/company/actions";
import { uploadAssessmentSubmissionFile } from "@/lib/storage/upload";
import {
  formatFileSize,
  getOpenAnswerMethods,
  isAllowedAssessmentFile,
  isUrlish,
  type AssessmentQuestion,
  type OpenAnswer,
} from "@/lib/assessments";
import {
  ClipboardCheck, Building, Clock, Timer, ChevronRight,
  CheckCircle, AlertCircle, Paperclip, ExternalLink,
} from "lucide-react";

type AssessmentClientRecord = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  time_limit: number | null;
  status: string;
  score: number | null;
  feedback: string | null;
  results_released: boolean;
  questions: DisplayAssessmentQuestion[] | null;
  submission: { answers?: Record<string, unknown> } | null;
  application?: {
    job?: {
      title?: string | null;
      company?: {
        name?: string | null;
        logo_url?: string | null;
      } | null;
    } | null;
  } | null;
};

type DisplayAssessmentQuestion = AssessmentQuestion & {
  isCorrect?: boolean;
  text?: string;
};

// ─── Instruction screen ───────────────────────────────────────────────────────

function InstructionsScreen({
  assessment,
  questionCount,
  onStart,
}: {
  assessment: AssessmentClientRecord;
  questionCount: number;
  onStart: () => void;
}) {
  const app = assessment.application;
  const job = app?.job;
  const company = job?.company;

  return (
    <div className="bg-white rounded-2xl border border-[#e5e2e1] overflow-hidden">
      <div className="p-8 flex flex-col items-center text-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#e5e2e1] flex items-center justify-center shrink-0 overflow-hidden p-2">
          {company?.logo_url ? (
            <img src={company.logo_url} alt={company.name ?? "Company"} className="w-full h-full object-contain" />
          ) : (
            <Building className="w-6 h-6 text-[#006d43]" />
          )}
        </div>

        <div>
          <h2 className="font-headline text-2xl font-medium text-[#1c1b1b] mb-1">
            {assessment.title}
          </h2>
          <p className="text-sm text-[#5f5e5e]">
            {company?.name ?? "Company"} · {job?.title ?? "Role"}
          </p>
        </div>

        <p className="text-[#3d4a41] text-sm leading-relaxed max-w-md">
          {assessment.description}
        </p>

        <div className="flex items-center gap-6 text-sm text-[#3d4a41]">
          <div className="flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-[#006d43]" />
            <span><span className="font-semibold text-[#1c1b1b]">{questionCount}</span> question{questionCount !== 1 ? "s" : ""}</span>
          </div>
          {assessment.time_limit && (
            <div className="flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-[#006d43]" />
              <span><span className="font-semibold text-[#1c1b1b]">{assessment.time_limit}</span> minute{assessment.time_limit !== 1 ? "s" : ""}</span>
            </div>
          )}
          {assessment.deadline && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#006d43]" />
              <span>Due {new Date(assessment.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            </div>
          )}
        </div>

        {assessment.time_limit && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 max-w-sm">
            Once you start, the timer will begin. The assessment auto-submits when time runs out.
          </p>
        )}

        <p className="text-xs text-[#5f5e5e] max-w-sm">
          Navigation is one-way — you cannot go back to a previous question after advancing.
        </p>

        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold px-8 py-3 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[#00a86b]/20"
        >
          Start Assessment
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Confirmation screen ──────────────────────────────────────────────────────

function ConfirmationScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e2e1] p-12 flex flex-col items-center text-center gap-6">
      <div className="w-16 h-16 rounded-full bg-[#78fbb6]/20 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-[#006d43]" />
      </div>
      <div>
        <h2 className="font-headline text-2xl font-medium text-[#1c1b1b] mb-2">
          Assessment Submitted
        </h2>
        <p className="text-[#3d4a41] text-sm">Your response has been recorded successfully.</p>
      </div>

      <div className="bg-[#f6f3f2] rounded-2xl px-8 py-4 text-center">
        <p className="text-sm text-[#3d4a41]">Results will be shared once the company reviews your submission.</p>
      </div>

      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#006d43] border border-[#006d43]/30 px-6 py-2.5 rounded-xl hover:bg-[#006d43]/5 transition-colors"
      >
        Back to Assessments
      </button>
    </div>
  );
}

// ─── Assessment taker ─────────────────────────────────────────────────────────

function AssessmentTaker({
  assessment,
  onComplete,
  onBack,
}: {
  assessment: AssessmentClientRecord;
  onComplete: (id: string) => void;
  onBack: () => void;
}) {
  const questions: DisplayAssessmentQuestion[] = assessment.questions ?? [];
  const [step, setStep] = useState<"instructions" | "taking" | "done">("instructions");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean | number[] | OpenAnswer>>({});
  const [fileSelections, setFileSelections] = useState<Record<string, File | null>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  const fileSelectionsRef = useRef(fileSelections);
  useEffect(() => { fileSelectionsRef.current = fileSelections; }, [fileSelections]);

  const submittingRef = useRef(false);

  function getOpenAnswer(index: number) {
    const answer = answers[String(index)];
    if (answer && typeof answer === "object" && !Array.isArray(answer)) return answer as OpenAnswer;
    if (typeof answer === "string") return { text: answer };
    return {};
  }

  function updateOpenAnswer(index: number, partial: OpenAnswer) {
    setAnswers((prev) => {
      const current = prev[String(index)];
      const base =
        current && typeof current === "object" && !Array.isArray(current)
          ? (current as OpenAnswer)
          : typeof current === "string"
            ? { text: current }
            : {};
      return { ...prev, [String(index)]: { ...base, ...partial } };
    });
  }

  function validateOpenQuestion(question: DisplayAssessmentQuestion, index: number) {
    if (question.type && question.type !== "open") return null;
    const methods = getOpenAnswerMethods({ ...question, type: "open" });
    const answer = getOpenAnswer(index);
    const selectedFile = fileSelections[String(index)];

    if (!methods.text && !methods.url && !methods.file) return "This question is missing an answer method.";
    if (answer.url?.trim() && !isUrlish(answer.url.trim())) return "Enter a valid http(s) link.";
    if (methods.required.includes("text") && !answer.text?.trim()) return "This question requires a written answer.";
    if (methods.required.includes("url") && !answer.url?.trim()) return "This question requires a link answer.";
    if (methods.required.includes("file") && !selectedFile && !answer.file?.path) {
      return "This question requires a file upload.";
    }
    return null;
  }

  function validateCurrentQuestion() {
    const validationError = validateOpenQuestion(questions[idx], idx);
    if (validationError) {
      setError(validationError);
      return false;
    }
    setError(null);
    return true;
  }

  async function prepareSubmissionAnswers(
    currentAnswers: Record<string, string | number | boolean | number[] | OpenAnswer>,
  ) {
    const prepared: Record<string, string | number | boolean | number[] | OpenAnswer> = { ...currentAnswers };

    for (const [index, question] of questions.entries()) {
      const validationError = validateOpenQuestion(question, index);
      if (validationError) return { error: `Question ${index + 1}: ${validationError}` };

      const selectedFile = fileSelectionsRef.current[String(index)];
      if (!selectedFile) continue;
      const fileError = isAllowedAssessmentFile(selectedFile);
      if (fileError) return { error: `Question ${index + 1}: ${fileError}` };

      const uploadResult = await uploadAssessmentSubmissionFile(assessment.id, index, selectedFile);
      if ("error" in uploadResult) return { error: `Question ${index + 1}: ${uploadResult.error}` };

      const existing = prepared[String(index)];
      const openAnswer =
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? (existing as OpenAnswer)
          : typeof existing === "string"
            ? { text: existing }
            : {};
      prepared[String(index)] = { ...openAnswer, file: uploadResult.file };
    }

    return { answers: prepared };
  }

  async function doSubmit(currentAnswers: Record<string, string | number | boolean | number[] | OpenAnswer>) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPending(true);
    const prepared = await prepareSubmissionAnswers(currentAnswers);
    if ("error" in prepared) {
      setError(prepared.error ?? "Could not prepare submission.");
      submittingRef.current = false;
      setPending(false);
      return;
    }
    const submission = { answers: prepared.answers, submitted_at: new Date().toISOString() };
    const formData = new FormData();
    formData.set("assessment_id", assessment.id);
    formData.set("submission", JSON.stringify(submission));
    const result = await submitAssessment(formData);
    if (result?.error) {
      setError(result.error);
      submittingRef.current = false;
      setPending(false);
      return;
    }
    setStep("done");
    onComplete(assessment.id);
    setPending(false);
  }

  // Countdown timer
  useEffect(() => {
    if (step !== "taking" || timeLeft === null) return;
    if (timeLeft <= 0) {
      doSubmit(answersRef.current);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [step, timeLeft]);

  function handleStart() {
    setTimeLeft(assessment.time_limit ? assessment.time_limit * 60 : null);
    setStep("taking");
  }

  function handleNext() {
    if (!validateCurrentQuestion()) return;
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
    } else {
      doSubmit(answers);
    }
  }

  const currentQ = questions[idx];

  if (step === "instructions") {
    return (
      <InstructionsScreen
        assessment={assessment}
        questionCount={questions.length}
        onStart={handleStart}
      />
    );
  }

  if (step === "done") {
    return <ConfirmationScreen onBack={onBack} />;
  }

  // step === "taking"
  const mins = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const secs = timeLeft !== null ? timeLeft % 60 : 0;
  const timeWarning = timeLeft !== null && timeLeft < 60;

  return (
    <div className="bg-white rounded-2xl border border-[#e5e2e1] overflow-hidden">
      {/* Progress header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0edec]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#1c1b1b]">
            Question {idx + 1} <span className="text-[#5f5e5e] font-normal">of {questions.length}</span>
          </span>
          <div className="w-24 h-1.5 bg-[#f0edec] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#006d43] rounded-full transition-all duration-300"
              style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1.5 font-mono text-sm font-bold ${timeWarning ? "text-red-500 animate-pulse" : "text-[#3d4a41]"}`}>
            <Timer className="w-4 h-4" />
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Question body */}
      <div className="p-6 flex flex-col gap-6">
        <h3 className="text-base font-semibold text-[#1c1b1b] leading-relaxed">
          {currentQ.question}
        </h3>

        {/* MCQ */}
        {currentQ.type === "mcq" && (
          <div className="flex flex-col gap-2.5">
            {(currentQ.options as string[]).map((opt: string, optIdx: number) => (
              <button
                key={optIdx}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [String(idx)]: optIdx }))}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  answers[String(idx)] === optIdx
                    ? "bg-[#006d43]/10 border-[#006d43] text-[#006d43]"
                    : "bg-[#f6f3f2] border-[#e5e2e1] text-[#1c1b1b] hover:border-[#006d43]/40"
                }`}
              >
                <span className="font-bold text-[#3d4a41] mr-2">{["A", "B", "C", "D"][optIdx]}.</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Multi-select */}
        {currentQ.type === "multiselect" && (
          <div className="flex flex-col gap-2.5">
            {(currentQ.options as string[]).map((opt: string, optIdx: number) => {
              const selected = Array.isArray(answers[String(idx)])
                ? (answers[String(idx)] as number[])
                : [];
              const checked = selected.includes(optIdx);
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => {
                    const next = new Set(selected);
                    if (checked) next.delete(optIdx);
                    else next.add(optIdx);
                    setAnswers((prev) => ({ ...prev, [String(idx)]: [...next].sort((a, b) => a - b) }));
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    checked
                      ? "bg-[#006d43]/10 border-[#006d43] text-[#006d43]"
                      : "bg-[#f6f3f2] border-[#e5e2e1] text-[#1c1b1b] hover:border-[#006d43]/40"
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 mr-2 rounded border border-current text-[10px]">
                    {checked ? "✓" : ""}
                  </span>
                  <span className="font-bold text-[#3d4a41] mr-2">{["A", "B", "C", "D"][optIdx]}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* True/False */}
        {currentQ.type === "truefalse" && (
          <div className="flex gap-3">
            {([true, false] as const).map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [String(idx)]: val }))}
                className={`flex-1 py-5 rounded-xl border text-sm font-bold transition-colors ${
                  answers[String(idx)] === val
                    ? "bg-[#006d43]/10 border-[#006d43] text-[#006d43]"
                    : "bg-[#f6f3f2] border-[#e5e2e1] text-[#1c1b1b] hover:border-[#006d43]/40"
                }`}
              >
                {val ? "True" : "False"}
              </button>
            ))}
          </div>
        )}

        {/* Configurable response */}
        {(!currentQ.type || currentQ.type === "open") && (
          <div className="flex flex-col gap-3">
            {(() => {
              const methods = getOpenAnswerMethods({ ...currentQ, type: "open" });
              const openAnswer = getOpenAnswer(idx);
              const selectedFile = fileSelections[String(idx)];
              return (
                <>
                  {methods.text && (
                    <textarea
                      rows={7}
                      value={openAnswer.text ?? ""}
                      onChange={(e) => updateOpenAnswer(idx, { text: e.target.value })}
                      placeholder="Write your answer here..."
                      className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
                    />
                  )}

                  {methods.url && (
                    <input
                      type="url"
                      value={openAnswer.url ?? ""}
                      onChange={(e) => updateOpenAnswer(idx, { url: e.target.value })}
                      placeholder="https://example.com/your-work"
                      className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-4 py-3 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                    />
                  )}

                  {methods.file && (
                    <label className="flex items-center justify-between gap-3 bg-[#f6f3f2] rounded-xl border border-dashed border-[#006d43]/30 px-4 py-3 text-sm text-[#3d4a41] cursor-pointer hover:bg-[#006d43]/5 transition-colors">
                      <span className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-4 h-4 text-[#006d43] shrink-0" />
                        <span className="truncate">
                          {selectedFile ? selectedFile.name : "Choose a PDF, DOC, image, or ZIP file"}
                        </span>
                      </span>
                      {selectedFile && (
                        <span className="text-xs text-[#5f5e5e] shrink-0">{formatFileSize(selectedFile.size)}</span>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          if (file) {
                            const fileError = isAllowedAssessmentFile(file);
                            if (fileError) {
                              setError(fileError);
                              e.currentTarget.value = "";
                              return;
                            }
                          }
                          setError(null);
                          setFileSelections((prev) => ({ ...prev, [String(idx)]: file }));
                        }}
                      />
                    </label>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleNext}
            disabled={pending}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold px-6 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[#00a86b]/20 text-sm disabled:opacity-60"
          >
            {pending
              ? "Submitting..."
              : idx + 1 === questions.length
              ? "Submit Assessment"
              : "Next Question"}
            {!pending && idx + 1 < questions.length && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assessment card (list view) ──────────────────────────────────────────────

function AssessmentSummaryCard({
  assessment,
  onStart,
}: {
  assessment: AssessmentClientRecord;
  onStart: () => void;
}) {
  const app = assessment.application;
  const job = app?.job;
  const company = job?.company;

  const statusColor =
    assessment.status === "pending"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : assessment.status === "submitted"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-[#78fbb6]/20 text-[#005232] border-[#78fbb6]/40";

  const statusLabel =
    assessment.status === "pending" ? "Pending" :
    assessment.status === "submitted" ? "Submitted" : "Reviewed";

  // Results breakdown for job seeker (after release)
  const questions: DisplayAssessmentQuestion[] = assessment.questions ?? [];
  const submissionAnswers: Record<string, unknown> =
    assessment.submission?.answers ?? {};
  const showResults = assessment.results_released && assessment.status !== "pending";

  return (
    <div className="bg-white rounded-2xl border border-[#e5e2e1] overflow-hidden">
      <div className="flex items-start justify-between p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-white border border-[#e5e2e1] flex items-center justify-center shrink-0 overflow-hidden p-1">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name ?? "Company"} className="w-full h-full object-contain" />
            ) : (
              <Building className="w-5 h-5 text-[#006d43]" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-[#1c1b1b]">{assessment.title}</h3>
            <p className="text-sm text-[#5f5e5e] mt-0.5">
              {company?.name ?? "Company"} · {job?.title ?? "Role"}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {assessment.deadline && (
                <p className="text-xs text-[#3d4a41] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Due {new Date(assessment.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
              {assessment.time_limit && (
                <p className="text-xs text-[#3d4a41] flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5" />
                  {assessment.time_limit} min
                </p>
              )}
            </div>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border shrink-0 ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="px-6 pb-4">
        <p className="text-sm text-[#3d4a41] leading-relaxed">{assessment.description}</p>
      </div>

      {/* Submitted — awaiting release */}
      {assessment.status !== "pending" && !assessment.results_released && (
        <div className="mx-6 mb-5 bg-[#f6f3f2] rounded-xl p-4 text-sm text-[#3d4a41]">
          Your assessment has been submitted. Results will be shared by the company.
        </div>
      )}

      {/* Results released — show score + breakdown */}
      {showResults && (
        <div className="mx-6 mb-5 flex flex-col gap-3">
          {assessment.score !== null && (
            <div className="bg-[#78fbb6]/10 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#006d43]" />
              <div>
                <p className="text-xs text-[#3d4a41]">Your Score</p>
                <p className="text-xl font-bold text-[#005232]">
                  {assessment.score}<span className="text-sm font-medium text-[#3d4a41]">/100</span>
                </p>
              </div>
              {assessment.feedback && (
                <p className="text-sm text-[#3d4a41] ml-4 border-l border-[#78fbb6]/40 pl-4">{assessment.feedback}</p>
              )}
            </div>
          )}

          {questions.length > 0 && (
            <div className="flex flex-col gap-2">
              {questions.map((q, qIdx: number) => {
                const answer = submissionAnswers[String(qIdx)];
                if (q.type === "open" || !q.type) {
                  const openAnswer =
                    answer && typeof answer === "object" && !Array.isArray(answer)
                      ? (answer as OpenAnswer)
                      : { text: typeof answer === "string" ? answer : "" };
                  return (
                    <div key={qIdx} className="bg-[#f6f3f2] rounded-xl p-3">
                      <p className="text-xs font-semibold text-[#1c1b1b] mb-1">Q{qIdx + 1}: {q.question ?? q.text}</p>
                      <div className="flex flex-col gap-1 text-xs text-[#3d4a41]">
                        {openAnswer.text && <p>{openAnswer.text}</p>}
                        {openAnswer.url && (
                          <a href={openAnswer.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#006d43] hover:underline">
                            <ExternalLink className="w-3 h-3" /> Submitted link
                          </a>
                        )}
                        {openAnswer.file && (
                          <p className="inline-flex items-center gap-1">
                            <Paperclip className="w-3 h-3" /> {openAnswer.file.name} ({formatFileSize(openAnswer.file.size)})
                          </p>
                        )}
                        {!openAnswer.text && !openAnswer.url && !openAnswer.file && <p>No answer provided</p>}
                      </div>
                    </div>
                  );
                }

                const isCorrect = q.isCorrect;

                if (q.type === "mcq") {
                  return (
                    <div key={qIdx} className="bg-[#f6f3f2] rounded-xl p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-semibold text-[#1c1b1b]">Q{qIdx + 1}: {q.question}</p>
                        {isCorrect !== undefined && (
                          <span className={`text-xs font-semibold ml-2 shrink-0 ${isCorrect ? "text-[#006d43]" : "text-red-500"}`}>
                            {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {(q.options as string[]).map((opt: string, oIdx: number) => (
                          <div key={oIdx} className={`text-xs px-2.5 py-1.5 rounded-lg ${
                            answer === oIdx
                              ? isCorrect ? "bg-[#78fbb6]/20 text-[#005232] font-medium" : "bg-red-50 text-red-600 font-medium"
                              : "text-[#5f5e5e]"
                          }`}>
                            <span className="font-bold mr-1">{["A","B","C","D"][oIdx]}.</span>{opt}
                            {answer === oIdx && (isCorrect ? " ✓" : " ✗")}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (q.type === "truefalse") {
                  return (
                    <div key={qIdx} className="bg-[#f6f3f2] rounded-xl p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-semibold text-[#1c1b1b]">Q{qIdx + 1}: {q.question}</p>
                        {isCorrect !== undefined && (
                          <span className={`text-xs font-semibold ml-2 shrink-0 ${isCorrect ? "text-[#006d43]" : "text-red-500"}`}>
                            {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {([true, false] as const).map((val) => (
                          <span key={String(val)} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                            answer === val
                              ? isCorrect ? "bg-[#78fbb6]/20 text-[#005232]" : "bg-red-50 text-red-600"
                              : "text-[#5f5e5e] bg-white border border-[#e5e2e1]"
                          }`}>
                            {val ? "True" : "False"}
                            {answer === val && (isCorrect ? " ✓" : " ✗")}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (q.type === "multiselect") {
                  const selectedAnswers = Array.isArray(answer) ? answer : [];
                  return (
                    <div key={qIdx} className="bg-[#f6f3f2] rounded-xl p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-semibold text-[#1c1b1b]">Q{qIdx + 1}: {q.question}</p>
                        {isCorrect !== undefined && (
                          <span className={`text-xs font-semibold ml-2 shrink-0 ${isCorrect ? "text-[#006d43]" : "text-red-500"}`}>
                            {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {(q.options as string[]).map((opt: string, oIdx: number) => {
                          const selected = selectedAnswers.includes(oIdx);
                          return (
                            <div key={oIdx} className={`text-xs px-2.5 py-1.5 rounded-lg ${
                              selected
                                ? isCorrect ? "bg-[#78fbb6]/20 text-[#005232] font-medium" : "bg-red-50 text-red-600 font-medium"
                                : "text-[#5f5e5e]"
                            }`}>
                              <span className="font-bold mr-1">{["A","B","C","D"][oIdx]}.</span>{opt}
                              {selected && (isCorrect ? " ✓" : " ✗")}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>
      )}

      {/* Start button for pending assessments */}
      {assessment.status === "pending" && (
        <button
          onClick={onStart}
          className="w-full flex items-center justify-between px-6 py-3.5 border-t border-[#f0edec] text-sm font-semibold text-[#006d43] hover:bg-[#f6f3f2] transition-colors"
        >
          Start Assessment
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function AssessmentsClient({ initialAssessments }: { initialAssessments: AssessmentClientRecord[] }) {
  const [assessments, setAssessments] = useState(initialAssessments);
  const [activeAssessment, setActiveAssessment] = useState<AssessmentClientRecord | null>(null);

  function handleComplete(submittedId: string) {
    setAssessments((prev) =>
      prev.map((a) => (a.id === submittedId ? { ...a, status: "submitted" } : a))
    );
  }

  function handleBack() {
    setActiveAssessment(null);
  }

  if (activeAssessment) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={handleBack}
          className="self-start text-sm text-[#3d4a41] hover:text-[#006d43] transition-colors"
        >
          ← Back to list
        </button>
        <AssessmentTaker
          assessment={activeAssessment}
          onComplete={handleComplete}
          onBack={handleBack}
        />
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e5e2e1] p-16 text-center">
        <ClipboardCheck className="w-12 h-12 text-[#3d4a41] mx-auto mb-4 opacity-40" />
        <h3 className="font-semibold text-[#1c1b1b] mb-2">No assessments yet</h3>
        <p className="text-[#3d4a41] text-sm">
          When a company sends you an assessment, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {assessments.map((a) => (
        <AssessmentSummaryCard
          key={a.id}
          assessment={a}
          onStart={() => setActiveAssessment(a)}
        />
      ))}
    </div>
  );
}
