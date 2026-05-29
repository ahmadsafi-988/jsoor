"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createTemplate, updateTemplate } from "@/lib/company/templates";
import type { TemplateRow } from "@/lib/company/templates";

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
  const typeLabel =
    q.type === "open" ? "Open Text" : q.type === "mcq" ? "Multiple Choice" : "True / False";

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

type Props = {
  template?: TemplateRow;
};

export function TemplateFormClient({ template }: Props) {
  const router = useRouter();
  const isEdit = !!template;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>(
    () => (template?.questions as QuestionDraft[] | null) ?? []
  );
  const [showAddType, setShowAddType] = useState(false);

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("questions", JSON.stringify(draftQuestions));

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
                {(["open", "mcq", "truefalse"] as QuestionType[]).map((type) => (
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
