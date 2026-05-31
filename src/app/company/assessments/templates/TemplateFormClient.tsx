"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createTemplate, updateTemplate } from "@/lib/company/templates";
import type { TemplateRow } from "@/lib/company/templates";
import type { OpenAnswerType } from "@/lib/assessments";

type QuestionType = "open" | "mcq" | "multiselect" | "truefalse";

type QuestionDraft =
  | {
      type: "open";
      question: string;
      points: number;
      allowTextAnswer: boolean;
      allowUrlAnswer: boolean;
      allowFileUpload: boolean;
      requiredAnswerTypes: OpenAnswerType[];
    }
  | { type: "mcq"; question: string; options: string[]; correct: number; points: number }
  | { type: "multiselect"; question: string; options: string[]; correct: number[]; points: number }
  | { type: "truefalse"; question: string; correct: boolean; points: number };

function normalizeDraftQuestion(q: QuestionDraft): QuestionDraft {
  if (q.type === "open" || !q.type) {
    const oldQuestion = q as QuestionDraft & { text?: string };
    const hasV3Fields =
      "allowTextAnswer" in q || "allowUrlAnswer" in q || "allowFileUpload" in q;
    return {
      type: "open",
      question: q.question ?? oldQuestion.text ?? "",
      points: q.points ?? 1,
      allowTextAnswer: hasV3Fields ? q.allowTextAnswer === true : true,
      allowUrlAnswer: q.allowUrlAnswer === true,
      allowFileUpload: q.allowFileUpload === true,
      requiredAnswerTypes: Array.isArray(q.requiredAnswerTypes) ? q.requiredAnswerTypes : [],
    };
  }
  return { ...q, points: q.points ?? 1 } as QuestionDraft;
}

function defaultQuestion(type: QuestionType): QuestionDraft {
  if (type === "mcq") {
    return { type: "mcq", question: "", options: ["", "", "", ""], correct: 0, points: 1 };
  }
  if (type === "multiselect") {
    return { type: "multiselect", question: "", options: ["", "", "", ""], correct: [], points: 1 };
  }
  if (type === "truefalse") {
    return { type: "truefalse", question: "", correct: true, points: 1 };
  }
  return {
    type: "open",
    question: "",
    points: 1,
    allowTextAnswer: true,
    allowUrlAnswer: false,
    allowFileUpload: false,
    requiredAnswerTypes: ["text"],
  };
}

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
  const typeLabel =
    q.type === "open"
      ? "Response"
      : q.type === "mcq"
      ? "Multiple Choice"
      : q.type === "multiselect"
      ? "Multi Select"
      : "True / False";

  function updateRequired(method: OpenAnswerType, checked: boolean) {
    if (q.type !== "open") return;
    const required = new Set(q.requiredAnswerTypes ?? []);
    if (checked) required.add(method);
    else required.delete(method);
    onChange({ ...q, requiredAnswerTypes: [...required] });
  }

  function updateOpenMethod(method: OpenAnswerType, checked: boolean) {
    if (q.type !== "open") return;
    const next = { ...q };
    if (method === "text") next.allowTextAnswer = checked;
    if (method === "url") next.allowUrlAnswer = checked;
    if (method === "file") next.allowFileUpload = checked;
    if (!checked) next.requiredAnswerTypes = (next.requiredAnswerTypes ?? []).filter((item) => item !== method);
    onChange(next);
  }

  return (
    <div className="bg-[#f6f3f2] rounded-xl p-4 flex flex-col gap-3 border border-[#e5e2e1]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wide">
          Q{idx + 1} · {typeLabel}
        </span>
        <button
          type="button"
          onClick={onDelete}
          className="text-[#5f5e5e] hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <input
        value={q.question}
        onChange={(e) => onChange({ ...q, question: e.target.value })}
        placeholder="Question text..."
        className="w-full bg-white rounded-lg border border-[#e5e2e1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
      />

      <div className="flex flex-col gap-1.5 max-w-32">
        <label className="text-[11px] font-semibold text-[#5f5e5e]">Points</label>
        <input
          type="number"
          min="1"
          step="1"
          value={q.points ?? 1}
          onChange={(e) => onChange({ ...q, points: Math.max(1, Number(e.target.value) || 1) } as QuestionDraft)}
          className="w-full bg-white rounded-lg border border-[#e5e2e1] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
        />
      </div>

      {q.type === "open" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {([
            ["text", "Text answer", q.allowTextAnswer],
            ["url", "Link answer", q.allowUrlAnswer],
            ["file", "File upload", q.allowFileUpload],
          ] as const).map(([method, label, enabled]) => (
            <div key={method} className="bg-white rounded-lg border border-[#e5e2e1] px-3 py-2 flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-[#3d4a41]">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => updateOpenMethod(method, e.target.checked)}
                  className="accent-[#006d43]"
                />
                {label}
              </label>
              <label className="flex items-center gap-2 text-[11px] text-[#5f5e5e]">
                <input
                  type="checkbox"
                  checked={(q.requiredAnswerTypes ?? []).includes(method)}
                  disabled={!enabled}
                  onChange={(e) => updateRequired(method, e.target.checked)}
                  className="accent-[#006d43] disabled:opacity-40"
                />
                Required
              </label>
            </div>
          ))}
        </div>
      )}

      {(q.type === "mcq" || q.type === "multiselect") && (
        <div className="flex flex-col gap-2">
          {(q.options.length > 0 ? q.options : ["", "", "", ""]).map((opt, optIdx) => (
            <div key={optIdx} className="flex items-center gap-2">
              <input
                type={q.type === "mcq" ? "radio" : "checkbox"}
                name={`correct-${idx}`}
                checked={q.type === "mcq" ? q.correct === optIdx : q.correct.includes(optIdx)}
                onChange={(e) => {
                  if (q.type === "mcq") {
                    onChange({ ...q, correct: optIdx });
                    return;
                  }
                  const correct = new Set(q.correct);
                  if (e.target.checked) correct.add(optIdx);
                  else correct.delete(optIdx);
                  onChange({ ...q, correct: [...correct].sort((a, b) => a - b) });
                }}
                className="accent-[#006d43]"
              />
              <input
                value={opt}
                onChange={(e) => {
                  const newOptions = [...q.options];
                  newOptions[optIdx] = e.target.value;
                  onChange({ ...q, options: newOptions } as QuestionDraft);
                }}
                placeholder={`Option ${["A", "B", "C", "D"][optIdx]}`}
                className="flex-1 bg-white rounded-lg border border-[#e5e2e1] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
              />
            </div>
          ))}
          <p className="text-xs text-[#5f5e5e]">
            {q.type === "mcq" ? "Select the radio button next to the correct answer." : "Check every correct answer."}
          </p>
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

type Props = {
  template?: TemplateRow;
};

export function TemplateFormClient({ template }: Props) {
  const router = useRouter();
  const isEdit = !!template;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>(
    () => ((template?.questions as QuestionDraft[] | null) ?? []).map(normalizeDraftQuestion)
  );
  const [showAddType, setShowAddType] = useState(false);

  function addQuestion(type: QuestionType) {
    setDraftQuestions((prev) => [...prev, defaultQuestion(type)]);
    setShowAddType(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const normalizedQuestions = draftQuestions.map(normalizeDraftQuestion);
    for (const [index, question] of normalizedQuestions.entries()) {
      if (!question.question.trim()) {
        setError(`Question ${index + 1} needs text.`);
        return;
      }
      if (!Number.isInteger(Number(question.points)) || Number(question.points) <= 0) {
        setError(`Question ${index + 1} needs positive whole-number points.`);
        return;
      }
      if (question.type === "open" && !question.allowTextAnswer && !question.allowUrlAnswer && !question.allowFileUpload) {
        setError(`Question ${index + 1} must allow at least one answer method.`);
        return;
      }
      if ((question.type === "mcq" || question.type === "multiselect") && question.options.filter(Boolean).length < 2) {
        setError(`Question ${index + 1} needs at least two options.`);
        return;
      }
      if (question.type === "multiselect" && question.correct.length === 0) {
        setError(`Question ${index + 1} needs at least one correct answer.`);
        return;
      }
    }

    setDraftQuestions(normalizedQuestions);
    const formData = new FormData(e.currentTarget);
    formData.set("questions", JSON.stringify(normalizedQuestions));

    startTransition(async () => {
      const res = isEdit
        ? await updateTemplate(template!.id, formData)
        : await createTemplate(formData);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="p-8 max-w-3xl mx-auto w-full flex flex-col gap-8">
      <div>
        <Link
          href="/company/assessments/templates"
          className="inline-flex items-center gap-1.5 text-sm text-[#3d4a41] hover:text-[#006d43] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Templates
        </Link>
        <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">
          {isEdit ? "Edit Template" : "New Template"}
        </h2>
        <p className="text-[#3d4a41] text-sm mt-1">
          {isEdit
            ? "Update this template. Changes apply to future uses only."
            : "Build a reusable assessment blueprint."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#e5e2e1] p-6 flex flex-col gap-5">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1c1b1b]">Template Name *</label>
          <input
            name="title"
            required
            defaultValue={template?.title ?? ""}
            placeholder="e.g. Frontend Technical Screen"
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1c1b1b]">Instructions</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={template?.description ?? ""}
            placeholder="Describe what the assessment covers..."
            className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
          />
        </div>

        {/* Time limit + Tags */}
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1c1b1b]">Time Limit (min)</label>
            <input
              name="time_limit"
              type="number"
              min="1"
              defaultValue={template?.time_limit ?? ""}
              placeholder="None"
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1c1b1b]">Tags</label>
            <input
              name="tags"
              defaultValue={template?.tags?.join(", ") ?? ""}
              placeholder="e.g. frontend, react, junior"
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
            />
            <p className="text-xs text-[#5f5e5e]">Comma-separated.</p>
          </div>
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#1c1b1b]">
            Questions{" "}
            <span className="font-normal text-[#5f5e5e]">({draftQuestions.length})</span>
          </label>

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
                {(["open", "mcq", "multiselect", "truefalse"] as QuestionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addQuestion(type)}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#f6f3f2] text-[#1c1b1b] transition-colors"
                  >
                    {type === "open"
                      ? "Open Text"
                      : type === "mcq"
                      ? "Multiple Choice"
                      : type === "multiselect"
                      ? "Multi Select"
                      : "True / False"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => router.push("/company/assessments/templates")}
            className="flex-1 py-2.5 rounded-xl border border-[#e5e2e1] text-sm font-medium text-[#3d4a41] hover:bg-[#f6f3f2] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-60"
          >
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </form>
    </div>
  );
}
