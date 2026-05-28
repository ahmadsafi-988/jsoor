"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Plus, Pencil, Trash2, Tag, Timer, ClipboardCheck } from "lucide-react";
import { deleteTemplate } from "@/lib/company/templates";
import type { TemplateRow } from "@/lib/company/templates";
import { AssessmentCreatorModal } from "../AssessmentCreatorModal";

export function TemplatesClient({ templates }: { templates: TemplateRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);

  function openCreator(template: TemplateRow | null = null) {
    setEditingTemplate(template);
    setCreatorOpen(true);
  }

  function closeCreator() {
    setCreatorOpen(false);
    setEditingTemplate(null);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteTemplate(id);
      setDeletingId(null);
      router.refresh();
    });
  }

  if (templates.length === 0) {
    return (
      <>
        <div className="bg-white rounded-2xl border border-[#e5e2e1] p-16 text-center">
          <LayoutTemplate className="w-12 h-12 text-[#3d4a41] mx-auto mb-4 opacity-40" />
          <h3 className="font-semibold text-[#1c1b1b] mb-2">No templates yet</h3>
          <p className="text-[#3d4a41] text-sm mb-6">
            Save reusable assessment blueprints so you do not have to rebuild from scratch each time.
          </p>
          <button
            type="button"
            onClick={() => openCreator()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Template
          </button>
        </div>
        {creatorOpen && (
          <AssessmentCreatorModal
            key="new-template"
            mode="template"
            onClose={closeCreator}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => openCreator()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-[#3d4a41] uppercase tracking-wider">
        <div className="col-span-4">Template</div>
        <div className="col-span-3">Tags</div>
        <div className="col-span-2">Questions</div>
        <div className="col-span-1 text-center">Uses</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {templates.map((t) => {
        const questions = Array.isArray(t.questions) ? t.questions : [];
        const isDeleting = deletingId === t.id && isPending;

        return (
          <div
            key={t.id}
            className="bg-white rounded-2xl border border-[#e5e2e1] hover:border-[#006d43]/20 transition-all"
          >
            <div className="grid grid-cols-12 gap-4 items-center px-6 py-5">
              {/* Name + meta */}
              <div className="col-span-4">
                <p className="font-semibold text-[#1c1b1b] text-sm">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-[#5f5e5e] mt-0.5 line-clamp-1">{t.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {t.time_limit && (
                    <span className="flex items-center gap-1 text-xs text-[#3d4a41]">
                      <Timer className="w-3 h-3" /> {t.time_limit} min
                    </span>
                  )}
                  <span className="text-xs text-[#5f5e5e]">
                    Updated {new Date(t.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="col-span-3">
                {t.tags && t.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {t.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#f6f3f2] border border-[#e5e2e1] text-[#3d4a41]"
                      >
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                    {t.tags.length > 3 && (
                      <span className="text-xs text-[#5f5e5e]">+{t.tags.length - 3}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-[#5f5e5e]">—</span>
                )}
              </div>

              {/* Question count */}
              <div className="col-span-2">
                <span className="inline-flex items-center gap-1.5 text-sm text-[#3d4a41]">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  {questions.length} question{questions.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Use count */}
              <div className="col-span-1 text-center">
                <span className="text-sm font-semibold text-[#1c1b1b]">{t.use_count}</span>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openCreator(t)}
                  className="p-2 rounded-lg text-[#3d4a41] hover:bg-[#f6f3f2] hover:text-[#006d43] transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={isDeleting}
                  className="p-2 rounded-lg text-[#3d4a41] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {creatorOpen && (
        <AssessmentCreatorModal
          key={editingTemplate?.id ?? "new-template"}
          mode="template"
          initialTemplate={editingTemplate}
          onClose={closeCreator}
        />
      )}
    </div>
  );
}
