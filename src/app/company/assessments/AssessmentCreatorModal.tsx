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
import type { OpenAnswerType } from "@/lib/assessments";

type Mode = "template" | "assessment";
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
    ? (template.questions as unknown as QuestionDraft[]).map(normalizeDraftQuestion)
    : [];
}

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
          {q.options.map((opt, optIdx) => (
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
    setDraftQuestions((prev) => [...prev, defaultQuestion(type)]);
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
    const normalizedQuestions = draftQuestions.map(normalizeDraftQuestion);

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

    startTransition(async () => {
      const formData = buildFormData();
      formData.set("questions", JSON.stringify(normalizedQuestions));

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
