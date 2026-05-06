"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  sendAssessment,
  updateApplicationStatus,
  reviewAssessment,
  releaseAssessmentResults,
} from "@/lib/company/actions";
import type { ApplicantProfileResult } from "@/lib/company/data";
import type { Tables } from "@/lib/supabase_generated_types";
import {
  ArrowLeft, User, MapPin, Globe, GraduationCap,
  FileText, ClipboardCheck, ChevronDown, ChevronUp, Star, Code2, ExternalLink,
  Plus, Trash2, Check, X, Timer, MessageSquare, LayoutTemplate,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getOrCreateConversation } from "@/lib/messages/actions";
import type { TemplateRow } from "@/lib/company/templates";

type ApplicationStatus =
  | "applied"
  | "under_review"
  | "assessment_sent"
  | "assessment_completed"
  | "shortlisted"
  | "accepted"
  | "rejected";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied:               "Applied",
  under_review:          "Under Review",
  assessment_sent:       "Assessment Sent",
  assessment_completed:  "Assessment Done",
  shortlisted:           "Shortlisted",
  accepted:              "Accepted",
  rejected:              "Rejected",
};

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  applied:               "bg-blue-50 text-blue-700 border-blue-200",
  under_review:          "bg-amber-50 text-amber-700 border-amber-200",
  assessment_sent:       "bg-purple-50 text-purple-700 border-purple-200",
  assessment_completed:  "bg-[#78fbb6]/20 text-[#005232] border-[#78fbb6]/40",
  shortlisted:           "bg-[#006d43]/10 text-[#006d43] border-[#006d43]/20",
  accepted:              "bg-emerald-500/15 text-emerald-700 border-emerald-300",
  rejected:              "bg-red-50 text-red-600 border-red-200",
};

const ALLOWED_TRANSITIONS: Partial<Record<ApplicationStatus, ApplicationStatus[]>> = {
  applied:               ["under_review"],
  under_review:          ["applied", "shortlisted", "rejected"],
  shortlisted:           ["accepted", "rejected", "under_review"],
  accepted:              ["rejected"],
  rejected:              ["under_review"],
  assessment_sent:       ["shortlisted", "accepted", "rejected", "under_review"],
  assessment_completed:  ["shortlisted", "accepted", "rejected", "under_review"],
};

// ─── Question types ───────────────────────────────────────────────────────────

type QuestionType = "open" | "mcq" | "truefalse";

type QuestionDraft =
  | { type: "open"; question: string }
  | { type: "mcq"; question: string; options: string[]; correct: number }
  | { type: "truefalse"; question: string; correct: boolean };

function QuestionDraftCard({
  q,
  idx,
  onChange,
  onDelete,
}: {
  q: QuestionDraft;
  idx: number;
  onChange: (updated: QuestionDraft) => void;
  onDelete: () => void;
}) {
  const typeLabel = q.type === "open" ? "Open Text" : q.type === "mcq" ? "Multiple Choice" : "True / False";

  return (
    <div className="bg-[#f6f3f2] rounded-xl p-4 flex flex-col gap-3 border border-[#e5e2e1]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wide">
          Q{idx + 1} · {typeLabel}
        </span>
        <button type="button" onClick={onDelete} className="text-[#5f5e5e] hover:text-red-500 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <input
        value={q.question}
        onChange={(e) => onChange({ ...q, question: e.target.value })}
        placeholder="Question text..."
        className="w-full bg-white rounded-lg border border-[#e5e2e1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
      />

      {q.type === "mcq" && (
        <div className="flex flex-col gap-2">
          {(q.options.length > 0 ? q.options : ["", "", "", ""]).map((opt, optIdx) => (
            <div key={optIdx} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${idx}`}
                checked={q.correct === optIdx}
                onChange={() => onChange({ ...q, correct: optIdx })}
                className="accent-[#006d43]"
              />
              <input
                value={opt}
                onChange={(e) => {
                  const newOptions = [...q.options];
                  newOptions[optIdx] = e.target.value;
                  onChange({ ...q, options: newOptions });
                }}
                placeholder={`Option ${["A", "B", "C", "D"][optIdx]}`}
                className="flex-1 bg-white rounded-lg border border-[#e5e2e1] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
              />
            </div>
          ))}
          <p className="text-xs text-[#5f5e5e]">Select the radio button next to the correct answer.</p>
        </div>
      )}

      {q.type === "truefalse" && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#5f5e5e]">Correct answer:</span>
          {([true, false] as const).map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => onChange({ ...q, correct: val })}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                q.correct === val
                  ? "bg-[#006d43] text-white border-[#006d43]"
                  : "bg-white border-[#e5e2e1] text-[#3d4a41] hover:border-[#006d43]/40"
              }`}
            >
              {val ? "True" : "False"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Per-question results (company view) ──────────────────────────────────────

function QuestionResultCard({
  q,
  idx,
  answers,
}: {
  q: any;
  idx: number;
  answers: Record<string, any>;
}) {
  const answer = answers[String(idx)];
  const isOldFormat = !q.type;

  if (isOldFormat) {
    return (
      <div className="bg-[#f6f3f2] rounded-xl p-3">
        <p className="text-xs font-semibold text-[#1c1b1b] mb-1">Q{idx + 1}: {q.text ?? q.question}</p>
        <p className="text-xs text-[#3d4a41]">{answer ?? answers[`q${q.id ?? idx + 1}`] ?? "No answer provided"}</p>
      </div>
    );
  }

  if (q.type === "open") {
    return (
      <div className="bg-[#f6f3f2] rounded-xl p-3">
        <p className="text-xs font-semibold text-[#1c1b1b] mb-1">Q{idx + 1}: {q.question}</p>
        <p className="text-xs text-[#3d4a41]">{answer ?? "No answer provided"}</p>
      </div>
    );
  }

  if (q.type === "mcq") {
    const isCorrect = answer === q.correct;
    return (
      <div className="bg-[#f6f3f2] rounded-xl p-3">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-semibold text-[#1c1b1b]">Q{idx + 1}: {q.question}</p>
          {answer !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-semibold ml-2 shrink-0 ${isCorrect ? "text-[#006d43]" : "text-red-500"}`}>
              {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              {isCorrect ? "Correct" : "Incorrect"}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {(q.options as string[]).map((opt: string, optIdx: number) => {
            const isSelected = answer === optIdx;
            const isCorrectOpt = q.correct === optIdx;
            return (
              <div
                key={optIdx}
                className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                  isSelected && isCorrect ? "bg-[#78fbb6]/20 text-[#005232]" :
                  isSelected && !isCorrect ? "bg-red-50 text-red-600" :
                  isCorrectOpt && !isSelected ? "bg-[#78fbb6]/10 text-[#006d43]" :
                  "text-[#5f5e5e]"
                }`}
              >
                <span><span className="font-bold mr-1">{["A","B","C","D"][optIdx]}.</span>{opt}</span>
                <span>
                  {isSelected && (isCorrect ? "✓ Your answer" : "✗ Your answer")}
                  {!isSelected && isCorrectOpt && "← Correct"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (q.type === "truefalse") {
    const isCorrect = answer === q.correct;
    return (
      <div className="bg-[#f6f3f2] rounded-xl p-3">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-semibold text-[#1c1b1b]">Q{idx + 1}: {q.question}</p>
          {answer !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-semibold ml-2 shrink-0 ${isCorrect ? "text-[#006d43]" : "text-red-500"}`}>
              {isCorrect ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              {isCorrect ? "Correct" : "Incorrect"}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {([true, false] as const).map((val) => {
            const isSelected = answer === val;
            const isCorrectVal = q.correct === val;
            return (
              <span
                key={String(val)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                  isSelected && isCorrect ? "bg-[#78fbb6]/20 text-[#005232]" :
                  isSelected && !isCorrect ? "bg-red-50 text-red-600" :
                  isCorrectVal && !isSelected ? "bg-[#78fbb6]/10 text-[#006d43]" :
                  "text-[#5f5e5e] bg-white border border-[#e5e2e1]"
                }`}
              >
                {val ? "True" : "False"}
                {isSelected && (isCorrect ? " ✓" : " ✗")}
                {!isSelected && isCorrectVal && " ← Correct"}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  result: ApplicantProfileResult;
  cvSignedUrl: string | null;
  initialAssessment: Tables<"assessments"> | null;
  templates: TemplateRow[];
};

export function ApplicantDetailClient({ result, cvSignedUrl, initialAssessment, templates }: Props) {
  const { application, applicant, projects, badges, skills } = result;
  const jsp = applicant.job_seeker_profile;
  const job = application.job;
  const name = `${applicant.first_name} ${applicant.last_name}`.trim();
  const router = useRouter();

  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(
    application.status as ApplicationStatus
  );
  const [statusChanging, setStatusChanging] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [assessment, setAssessment] = useState<Tables<"assessments"> | null>(initialAssessment);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Question builder state
  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>([]);
  const [showAddType, setShowAddType] = useState(false);

  // Template state
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const titleRef = React.useRef<HTMLInputElement>(null);
  const descRef = React.useRef<HTMLTextAreaElement>(null);
  const timeLimitRef = React.useRef<HTMLInputElement>(null);

  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  async function handleStatusChange(newStatus: ApplicationStatus) {
    if (newStatus === currentStatus) return;
    setStatusChanging(true);
    setStatusError(null);
    const res = await updateApplicationStatus(application.id, newStatus);
    if (res?.error) { setStatusError(res.error); } else { setCurrentStatus(newStatus); }
    setStatusChanging(false);
  }

  function addQuestion(type: QuestionType) {
    const newQ: QuestionDraft =
      type === "mcq"
        ? { type: "mcq", question: "", options: ["", "", "", ""], correct: 0 }
        : type === "truefalse"
        ? { type: "truefalse", question: "", correct: true }
        : { type: "open", question: "" };
    setDraftQuestions((prev) => [...prev, newQ]);
    setShowAddType(false);
  }

  async function handleSendAssessment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (draftQuestions.length === 0) {
      setFormError("Add at least one question.");
      return;
    }
    setPending(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("application_id", application.id);
    formData.set("questions", JSON.stringify(draftQuestions));

    const res = await sendAssessment(formData);
    if (res?.error) {
      setFormError(res.error);
    } else {
      setShowAssessmentForm(false);
      setDraftQuestions([]);
      setCurrentStatus("assessment_sent");
      const supabase = createClient();
      const { data: a } = await supabase
        .from("assessments")
        .select("*")
        .eq("application_id", application.id)
        .maybeSingle();
      setAssessment(a ?? null);
    }
    setPending(false);
  }

  async function handleReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!assessment) return;
    setPending(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("assessment_id", assessment.id);
    const res = await reviewAssessment(formData);
    if (res?.error) {
      setFormError(res.error);
    } else {
      const supabase = createClient();
      const { data: a } = await supabase
        .from("assessments")
        .select("*")
        .eq("application_id", application.id)
        .maybeSingle();
      setAssessment(a ?? null);
    }
    setPending(false);
  }

  async function handleRelease() {
    if (!assessment) return;
    setPending(true);
    const res = await releaseAssessmentResults(assessment.id);
    if (res?.error) {
      setFormError(res.error);
    } else {
      setAssessment((prev) => prev ? { ...prev, results_released: true } : prev);
    }
    setPending(false);
  }

  // Parse submission answers — handles both V1 and V2 formats
  const submissionRaw = assessment?.submission as any;
  const submissionAnswers: Record<string, any> =
    submissionRaw?.answers ?? submissionRaw ?? {};

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto w-full flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <Link
            href={`/company/jobs/${job.id}/applicants`}
            className="inline-flex items-center gap-1.5 text-sm text-[#5f5e5e] hover:text-[#006d43] transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Applicants
          </Link>
          <button
            type="button"
            onClick={async () => {
              const result = await getOrCreateConversation(application.id);
              if ("conversationId" in result) {
                router.push(`/company/messages?conv=${result.conversationId}`);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#006d43] text-[#006d43] text-sm font-semibold hover:bg-[#006d43] hover:text-white transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Message
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm px-7 py-5 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline text-2xl font-bold tracking-tight text-[#1c1b1b]">
              {name}
            </h2>
            <p className="text-[#5f5e5e] text-sm">
              Applying for{" "}
              <span className="font-semibold text-[#1c1b1b]">{job.title}</span>
              {job.type && (
                <span className="text-[#5f5e5e]"> · {job.type}</span>
              )}
              {job.location && (
                <span className="text-[#5f5e5e]"> · {job.location}</span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {allowedTargets.length > 0 ? (
              <select
                value={currentStatus}
                disabled={statusChanging}
                onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none ${STATUS_STYLES[currentStatus] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
              >
                <option value={currentStatus}>{STATUS_LABELS[currentStatus]}</option>
                {allowedTargets.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            ) : (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS_STYLES[currentStatus] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                {STATUS_LABELS[currentStatus]}
              </span>
            )}
            {statusError && <p className="text-xs text-red-500">{statusError}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-6 flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[#f0edec] overflow-hidden shrink-0 flex items-center justify-center ring-2 ring-[#e5e2e1]">
              {applicant.avatar_url ? (
                <img src={applicant.avatar_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-9 h-9 text-[#3d4a41]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#1c1b1b] text-xl leading-tight">{name}</h3>
              {jsp?.degree && (
                <p className="text-[#3d4a41] text-sm flex items-center gap-1.5 mt-1.5">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  {jsp.degree}{jsp.institution ? ` at ${jsp.institution}` : ""}
                </p>
              )}
              {jsp?.location && (
                <p className="text-[#5f5e5e] text-sm flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 shrink-0" /> {jsp.location}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {jsp?.github && (
                  <a href={`https://github.com/${jsp.github}`} target="_blank" rel="noopener noreferrer"
                    className="text-[#5f5e5e] hover:text-[#006d43] transition-colors" title="GitHub">
                    <Code2 className="w-4 h-4" />
                  </a>
                )}
                {jsp?.website && (
                  <a href={jsp.website} target="_blank" rel="noopener noreferrer"
                    className="text-[#5f5e5e] hover:text-[#006d43] transition-colors" title="Website">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {cvSignedUrl && (
                  <a href={cvSignedUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006d43] border border-[#006d43]/30 px-3 py-1.5 rounded-full hover:bg-[#006d43]/5 transition-colors">
                    <FileText className="w-3.5 h-3.5" /> Download CV
                  </a>
                )}
              </div>
            </div>
          </div>

          {jsp?.bio && (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-6">
              <h4 className="font-semibold text-[#1c1b1b] text-sm uppercase tracking-wide mb-3 pb-3 border-b border-[#f0edec]">About</h4>
              <p className="text-[#3d4a41] text-sm leading-relaxed">{jsp.bio}</p>
            </div>
          )}

          {skills.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-6">
              <h4 className="font-semibold text-[#1c1b1b] text-sm uppercase tracking-wide mb-3 pb-3 border-b border-[#f0edec]">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-full bg-[#f6f3f2] border border-[#e5e2e1] text-sm text-[#3d4a41] font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-6">
              <h4 className="font-semibold text-[#1c1b1b] text-sm uppercase tracking-wide mb-4 pb-3 border-b border-[#f0edec]">Projects</h4>
              <div className="flex flex-col gap-5">
                {projects.map((project) => (
                  <div key={project.id} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1c1b1b] text-sm">{project.name}</span>
                      {project.url && (
                        <a href={project.url} target="_blank" rel="noopener noreferrer"
                          className="text-[#5f5e5e] hover:text-[#006d43] transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <span className={`ml-auto text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        project.status === "Live" ? "bg-[#78fbb6]/20 text-[#005232]" : "bg-amber-50 text-amber-700"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-[#5f5e5e] text-sm leading-relaxed">{project.description}</p>
                    {project.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {project.skills.map((s) => (
                          <span key={s} className="text-xs px-2.5 py-0.5 rounded-full bg-[#f6f3f2] border border-[#e5e2e1] text-[#3d4a41]">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {badges.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-6">
              <h4 className="font-semibold text-[#1c1b1b] text-sm uppercase tracking-wide mb-4 pb-3 border-b border-[#f0edec]">Certifications & Badges</h4>
              <div className="flex flex-col gap-4">
                {badges.map((badge) => (
                  <div key={badge.id} className="flex items-center gap-4">
                    {badge.image && (
                      <img src={badge.image} alt={badge.name} className="w-11 h-11 rounded-xl object-contain shrink-0 border border-[#e5e2e1]" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1c1b1b] truncate">{badge.name}</p>
                      <p className="text-xs text-[#5f5e5e] mt-0.5">{badge.issuer} · {badge.date}</p>
                    </div>
                    {badge.url && (
                      <a href={badge.url} target="_blank" rel="noopener noreferrer"
                        className="text-[#5f5e5e] hover:text-[#006d43] transition-colors shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {application.cover_letter && (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-6">
              <h4 className="font-semibold text-[#1c1b1b] text-sm uppercase tracking-wide mb-3 pb-3 border-b border-[#f0edec]">Cover Letter</h4>
              <p className="text-[#3d4a41] text-sm leading-relaxed whitespace-pre-wrap">
                {application.cover_letter}
              </p>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-6">
          {/* Assessment panel */}
          {assessment ? (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0edec]">
                <h4 className="font-semibold text-[#1c1b1b] text-sm uppercase tracking-wide">Assessment</h4>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  assessment.status === "pending"   ? "bg-amber-50 text-amber-700" :
                  assessment.status === "submitted" ? "bg-blue-50 text-blue-700"  :
                  "bg-[#78fbb6]/20 text-[#005232]"
                }`}>
                  {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                </span>
              </div>

              <div>
                <p className="font-medium text-[#1c1b1b] text-sm">{assessment.title}</p>
                <p className="text-[#5f5e5e] text-xs mt-1">{assessment.description}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {assessment.deadline && (
                    <p className="text-xs text-[#3d4a41]">
                      Due: {new Date(assessment.deadline).toLocaleDateString()}
                    </p>
                  )}
                  {assessment.time_limit && (
                    <p className="text-xs text-[#3d4a41] flex items-center gap-1">
                      <Timer className="w-3 h-3" /> {assessment.time_limit} min
                    </p>
                  )}
                </div>
              </div>

              {/* Score (shown once submitted) */}
              {assessment.status !== "pending" && assessment.score !== null && (
                <div className="bg-[#f6f3f2] rounded-xl p-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#006d43]" />
                  <span className="text-sm font-bold text-[#005232]">
                    {assessment.score} / 100
                  </span>
                  {assessment.feedback && (
                    <p className="text-xs text-[#3d4a41] mt-0.5 ml-2">{assessment.feedback}</p>
                  )}
                </div>
              )}

              {/* Submission breakdown */}
              {assessment.status !== "pending" && assessment.submission && (
                <div>
                  <button
                    onClick={() => setShowSubmission((s) => !s)}
                    className="w-full flex items-center justify-between text-sm font-medium text-[#006d43] py-2"
                  >
                    View Submission{" "}
                    {showSubmission ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showSubmission && (
                    <div className="mt-2 flex flex-col gap-2">
                      {((assessment.questions as any[]) ?? []).map((q: any, idx: number) => (
                        <QuestionResultCard
                          key={idx}
                          q={q}
                          idx={idx}
                          answers={submissionAnswers}
                        />
                      ))}

                      {assessment.status === "submitted" && (
                        <form onSubmit={handleReview} className="flex flex-col gap-3 mt-2 pt-2 border-t border-[#f0edec]">
                          <div>
                            <label className="text-xs font-semibold text-[#1c1b1b] mb-1 block">
                              Feedback (optional)
                            </label>
                            <textarea
                              name="feedback"
                              rows={3}
                              defaultValue={assessment.feedback ?? ""}
                              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
                              placeholder="Add feedback for the candidate..."
                            />
                          </div>
                          {/* Keep score override for cases where all questions are open */}
                          {assessment.score === null && (
                            <div>
                              <label className="text-xs font-semibold text-[#1c1b1b] mb-1 block">
                                Score (0–100)
                              </label>
                              <input
                                name="score"
                                type="number"
                                min="0"
                                max="100"
                                className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                              />
                            </div>
                          )}
                          {formError && (
                            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
                          )}
                          <button
                            type="submit"
                            disabled={pending}
                            className="w-full bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-60"
                          >
                            {pending ? "Saving..." : "Mark as Reviewed"}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Release results */}
              {assessment.status !== "pending" && (
                <div className="pt-2 border-t border-[#f0edec]">
                  {assessment.results_released ? (
                    <p className="text-xs font-semibold text-[#006d43] flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Results Released to Candidate
                    </p>
                  ) : (
                    <button
                      onClick={handleRelease}
                      disabled={pending}
                      className="w-full text-sm font-semibold text-[#006d43] border border-[#006d43]/30 py-2 rounded-xl hover:bg-[#006d43]/5 transition-colors disabled:opacity-60"
                    >
                      Release Results to Candidate
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-6">
              <h4 className="font-semibold text-[#1c1b1b] text-sm uppercase tracking-wide mb-1 pb-3 border-b border-[#f0edec]">Assessment</h4>
              <p className="text-[#5f5e5e] text-sm mt-3 mb-4">No assessment sent yet.</p>
              <button
                onClick={() => setShowAssessmentForm((s) => !s)}
                className="w-full bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <ClipboardCheck className="w-4 h-4" />
                {showAssessmentForm ? "Cancel" : "Send Assessment"}
              </button>
            </div>
          )}

          {/* Assessment builder form */}
          {showAssessmentForm && !assessment && (
            <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#f0edec]">
                <h4 className="font-semibold text-[#1c1b1b] text-sm uppercase tracking-wide">New Assessment</h4>
                {templates.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowTemplatePicker(true)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        loadedTemplateId
                          ? "bg-[#006d43]/10 text-[#006d43] border-[#006d43]/30"
                          : "text-[#006d43] border-[#006d43]/30 hover:bg-[#006d43]/5"
                      }`}
                    >
                      <LayoutTemplate className="w-3.5 h-3.5" />
                      {loadedTemplateId ? "Template Loaded ✓" : "Load Template"}
                    </button>
                    {loadedTemplateId && (
                      <button
                        type="button"
                        onClick={() => setLoadedTemplateId(null)}
                        title="Clear template"
                        className="p-1.5 rounded-lg text-[#5f5e5e] hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <form onSubmit={handleSendAssessment} className="flex flex-col gap-4">
                {loadedTemplateId && (
                  <input type="hidden" name="template_id" value={loadedTemplateId} />
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1c1b1b]">Title *</label>
                  <input
                    ref={titleRef}
                    name="title"
                    required
                    placeholder="e.g. Technical Assessment"
                    className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1c1b1b]">Instructions *</label>
                  <textarea
                    ref={descRef}
                    name="description"
                    required
                    rows={3}
                    placeholder="Describe the task or what the applicant should do..."
                    className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1c1b1b]">Deadline</label>
                    <input
                      name="deadline"
                      type="date"
                      className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#1c1b1b]">Time Limit (min)</label>
                    <input
                      ref={timeLimitRef}
                      name="time_limit"
                      type="number"
                      min="1"
                      placeholder="None"
                      className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                    />
                  </div>
                </div>

                {/* Questions list */}
                {draftQuestions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-[#1c1b1b]">Questions</label>
                    {draftQuestions.map((q, idx) => (
                      <QuestionDraftCard
                        key={idx}
                        q={q}
                        idx={idx}
                        onChange={(updated) =>
                          setDraftQuestions((prev) => prev.map((x, i) => (i === idx ? updated : x)))
                        }
                        onDelete={() =>
                          setDraftQuestions((prev) => prev.filter((_, i) => i !== idx))
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Add question */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAddType((s) => !s)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-[#006d43]/30 text-sm font-medium text-[#006d43] hover:bg-[#006d43]/5 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                  {showAddType && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#e5e2e1] shadow-lg z-10 p-2 flex flex-col gap-1">
                      {(["open", "mcq", "truefalse"] as QuestionType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => addQuestion(type)}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#f6f3f2] text-[#1c1b1b] transition-colors"
                        >
                          {type === "open" ? "Open Text" : type === "mcq" ? "Multiple Choice" : "True / False"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {formError && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
                )}
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {pending ? "Sending..." : "Send Assessment"}
                </button>
              </form>
            </div>
          )}

          {/* Application meta */}
          <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-sm p-6">
            <h4 className="font-semibold text-[#1c1b1b] text-sm uppercase tracking-wide mb-3 pb-3 border-b border-[#f0edec]">Application Details</h4>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#5f5e5e]">Applied</span>
                <span className="font-semibold text-[#1c1b1b]">
                  {new Date(application.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5f5e5e]">Last Updated</span>
                <span className="font-semibold text-[#1c1b1b]">
                  {new Date(application.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template picker modal */}
      {showTemplatePicker && templates.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTemplatePicker(false); }}
        >
          <div className="bg-white rounded-2xl border border-[#e5e2e1] shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e2e1] shrink-0">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-[#006d43]" />
                <div>
                  <h3 className="font-semibold text-[#1c1b1b] text-sm">Choose a Template</h3>
                  <p className="text-xs text-[#5f5e5e]">{templates.length} template{templates.length !== 1 ? "s" : ""} available</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatePicker(false)}
                className="p-1.5 rounded-lg hover:bg-[#f6f3f2] text-[#5f5e5e] hover:text-[#1c1b1b] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template list */}
            <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-3">
              {templates.map((t) => {
                const qCount = ((t.questions as any[]) ?? []).length;
                const tags = t.tags as string[] | null;
                const isLoaded = loadedTemplateId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isLoaded
                        ? "border-[#006d43] bg-[#006d43]/5"
                        : "border-[#e5e2e1] hover:border-[#006d43]/30 hover:bg-[#f6f3f2]/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#1c1b1b] truncate">{t.name}</p>
                        {t.description && (
                          <p className="text-xs text-[#5f5e5e] mt-0.5 line-clamp-2">{t.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-[#5f5e5e]">
                          <span className="flex items-center gap-1">
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            {qCount} question{qCount !== 1 ? "s" : ""}
                          </span>
                          {t.time_limit && (
                            <span className="flex items-center gap-1">
                              <Timer className="w-3.5 h-3.5" />
                              {t.time_limit} min
                            </span>
                          )}
                        </div>
                        {tags && tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-medium bg-[#006d43]/10 text-[#006d43] px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (titleRef.current) titleRef.current.value = t.name;
                          if (descRef.current) descRef.current.value = t.description ?? "";
                          if (timeLimitRef.current) timeLimitRef.current.value = t.time_limit ? String(t.time_limit) : "";
                          setDraftQuestions((t.questions as QuestionDraft[] | null) ?? []);
                          setLoadedTemplateId(t.id);
                          setShowTemplatePicker(false);
                        }}
                        className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          isLoaded
                            ? "bg-[#006d43] text-white"
                            : "bg-white border border-[#006d43]/30 text-[#006d43] hover:bg-[#006d43] hover:text-white"
                        }`}
                      >
                        {isLoaded ? "Loaded ✓" : "Use"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
