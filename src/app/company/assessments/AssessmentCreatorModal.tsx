"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ClipboardCheck,
  LayoutTemplate,
  Plus,
  Save,
  Send,
  Tag,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { sendAssessment } from "@/lib/company/actions";
import { createTemplateRecord, updateTemplateRecord } from "@/lib/company/templates";
import type { TemplateRow } from "@/lib/company/templates";

type Mode = "template" | "assessment";
type QuestionType = "open" | "mcq" | "truefalse";

type QuestionDraft =
  | { type: "open"; question: string }
  | { type: "mcq"; question: string; options: string[]; correct: number }
  | { type: "truefalse"; question: string; correct: boolean };

type Props = {
  mode: Mode;
  applicationId?: string;
  applicationIds?: string[];
  initialTemplate?: TemplateRow | null;
  templates?: TemplateRow[];
  onClose: () => void;
  onAssessmentSent?: (result?: { sentCount?: number; skippedCount?: number }) => Promise<void> | void;
};

function getTemplateQuestions(template?: TemplateRow | null): QuestionDraft[] {
  return Array.isArray(template?.questions)
    ? (template.questions as unknown as QuestionDraft[])
    : [];
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
    q.type === "open" ? "Open Text" : q.type === "mcq" ? "Multiple Choice" : "True / False";

  return (
    <div className="bg-[#f6f3f2] rounded-xl p-4 flex flex-col gap-3 border border-[#e5e2e1]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#3d4a41] uppercase tracking-wide">
          Q{idx + 1} - {typeLabel}
        </span>
        <button
          type="button"
          onClick={onDelete}
          className="text-[#5f5e5e] hover:text-red-500 transition-colors"
          aria-label={`Delete question ${idx + 1}`}
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
          {q.options.map((opt, optIdx) => (
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

export function AssessmentCreatorModal({
  mode,
  applicationId,
  applicationIds = [],
  initialTemplate = null,
  templates = [],
  onClose,
  onAssessmentSent,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTemplate?.title ?? "");
  const [description, setDescription] = useState(initialTemplate?.description ?? "");
  const [deadline, setDeadline] = useState("");
  const [timeLimit, setTimeLimit] = useState(
    initialTemplate?.time_limit ? String(initialTemplate.time_limit) : ""
  );
  const [tags, setTags] = useState(initialTemplate?.tags?.join(", ") ?? "");
  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>(
    () => getTemplateQuestions(initialTemplate)
  );
  const [showAddType, setShowAddType] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(
    initialTemplate?.id ?? null
  );

  const isTemplateMode = mode === "template";
  const isEditingTemplate = isTemplateMode && !!initialTemplate;
  const targetApplicationIds = applicationIds.length > 0
    ? applicationIds
    : applicationId
      ? [applicationId]
      : [];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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

  function loadTemplate(template: TemplateRow) {
    setTitle(template.title);
    setDescription(template.description ?? "");
    setTimeLimit(template.time_limit ? String(template.time_limit) : "");
    setTags(template.tags?.join(", ") ?? "");
    setDraftQuestions(getTemplateQuestions(template));
    setLoadedTemplateId(template.id);
  }

  function buildFormData() {
    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("description", description.trim());
    formData.set("time_limit", timeLimit);
    formData.set("tags", tags);
    formData.set("questions", JSON.stringify(draftQuestions));
    if (deadline) formData.set("deadline", deadline);
    if (loadedTemplateId) formData.set("template_id", loadedTemplateId);
    if (targetApplicationIds.length > 1) {
      formData.set("application_ids", JSON.stringify(targetApplicationIds));
    } else if (targetApplicationIds[0]) {
      formData.set("application_id", targetApplicationIds[0]);
    }
    return formData;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!isTemplateMode && !description.trim()) {
      setError("Instructions are required.");
      return;
    }

    if (!isTemplateMode && draftQuestions.length === 0) {
      setError("Add at least one question.");
      return;
    }

    startTransition(async () => {
      const formData = buildFormData();

      if (isTemplateMode) {
        const result = isEditingTemplate
          ? await updateTemplateRecord(initialTemplate.id, formData)
          : await createTemplateRecord(formData);
        if ("error" in result) {
          setError(result.error ?? "Could not save template.");
          return;
        }
        router.refresh();
        onClose();
        return;
      }

      if (targetApplicationIds.length === 0) {
        setError("Application is missing.");
        return;
      }

      if (saveAsTemplate) {
        const templateResult = await createTemplateRecord(formData);
        if ("error" in templateResult) {
          setError(templateResult.error ?? "Could not save template.");
          return;
        }
        formData.set("template_id", templateResult.templateId ?? "");
      }

      const sendResult = await sendAssessment(formData);
      if ("error" in sendResult) {
        setError(sendResult.error ?? "Could not send assessment.");
        return;
      }

      router.refresh();
      await onAssessmentSent?.(sendResult);
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-2xl border border-[#e5e2e1] shadow-2xl w-full max-w-3xl max-h-[86vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#e5e2e1] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#006d43]/10 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5 text-[#006d43]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-headline text-xl font-semibold text-[#1c1b1b] tracking-tight">
                {isTemplateMode
                  ? isEditingTemplate
                    ? "Edit Template"
                    : "New Template"
                  : "New Assessment"}
              </h3>
              {!isTemplateMode && targetApplicationIds.length > 1 && (
                <p className="text-xs text-[#5f5e5e] mt-0.5">
                  Sending to {targetApplicationIds.length} selected applicants.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-2 rounded-lg text-[#5f5e5e] hover:bg-[#f6f3f2] hover:text-[#1c1b1b] transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">
            {!isTemplateMode && templates.length > 0 && (
              <div className="rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] p-3">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#3d4a41] uppercase tracking-wide">
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  Templates
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {templates.map((template) => {
                    const isLoaded = loadedTemplateId === template.id;
                    const questionCount = Array.isArray(template.questions)
                      ? template.questions.length
                      : 0;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => loadTemplate(template)}
                        className={`shrink-0 min-w-[190px] text-left rounded-lg border px-3 py-2 transition-colors ${
                          isLoaded
                            ? "border-[#006d43] bg-white text-[#006d43]"
                            : "border-[#e5e2e1] bg-white text-[#1c1b1b] hover:border-[#006d43]/40"
                        }`}
                      >
                        <span className="block text-sm font-semibold truncate">{template.title}</span>
                        <span className="mt-1 flex items-center gap-3 text-xs text-[#5f5e5e]">
                          <span className="flex items-center gap-1">
                            <ClipboardCheck className="w-3 h-3" />
                            {questionCount}
                          </span>
                          {template.time_limit && (
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {template.time_limit}m
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1c1b1b]">Title *</label>
                <input
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Technical Assessment"
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1c1b1b]">
                  Instructions{isTemplateMode ? "" : " *"}
                </label>
                <textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required={!isTemplateMode}
                  rows={3}
                  placeholder="Describe the task or what the applicant should do..."
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
                />
              </div>

              {!isTemplateMode && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1c1b1b]">Deadline</label>
                  <input
                    name="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#1c1b1b]">Time Limit (min)</label>
                <input
                  name="time_limit"
                  type="number"
                  min="1"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  placeholder="None"
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                />
              </div>

              <div className={`flex flex-col gap-1.5 ${isTemplateMode ? "md:col-span-2" : ""}`}>
                <label className="text-xs font-semibold text-[#1c1b1b]">Tags</label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-[#5f5e5e] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    name="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="frontend, react, junior"
                    className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006d43]/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-[#1c1b1b]">
                  Questions{" "}
                  <span className="font-normal text-[#5f5e5e]">({draftQuestions.length})</span>
                </label>
              </div>

              {draftQuestions.map((q, idx) => (
                <QuestionDraftCard
                  key={idx}
                  q={q}
                  idx={idx}
                  onChange={(updated) =>
                    setDraftQuestions((prev) => prev.map((x, i) => (i === idx ? updated : x)))
                  }
                  onDelete={() => setDraftQuestions((prev) => prev.filter((_, i) => i !== idx))}
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

            {!isTemplateMode && !loadedTemplateId && (
              <label className="flex items-center gap-2 text-sm text-[#3d4a41]">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="accent-[#006d43]"
                />
                Save as template
              </label>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>

          <div className="border-t border-[#e5e2e1] px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-[#e5e2e1] text-sm font-medium text-[#3d4a41] hover:bg-[#f6f3f2] transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-60"
            >
              {isPending ? (
                "Saving..."
              ) : isTemplateMode ? (
                <>
                  {isEditingTemplate ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {isEditingTemplate ? "Save Changes" : "Save Template"}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Assessment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
