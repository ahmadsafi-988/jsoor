"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardCheck, GraduationCap, MapPin, User } from "lucide-react";
import type { ApplicationWithProfile } from "@/lib/company/data";
import type { TemplateRow } from "@/lib/company/templates";
import { AssessmentCreatorModal } from "../../../assessments/AssessmentCreatorModal";

const STATUS_STYLES: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  assessment_sent: "bg-purple-50 text-purple-700",
  assessment_completed: "bg-[#78fbb6]/20 text-[#005232]",
  shortlisted: "bg-[#006d43]/10 text-[#006d43]",
  accepted: "bg-emerald-500/15 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  under_review: "Under Review",
  assessment_sent: "Assessment Sent",
  assessment_completed: "Assessment Done",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
};

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "assessment_sent", label: "Assessment Sent" },
  { value: "assessment_completed", label: "Assessment Done" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

type Props = {
  applicants: ApplicationWithProfile[];
  statusFilter?: string;
  templates: TemplateRow[];
};

export function JobApplicantsClient({ applicants, statusFilter, templates }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const filtered = useMemo(
    () => (statusFilter ? applicants.filter((a) => a.status === statusFilter) : applicants),
    [applicants, statusFilter]
  );

  const countByStatus = useMemo(
    () =>
      applicants.reduce<Record<string, number>>((acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      }, {}),
    [applicants]
  );

  const visibleIds = filtered.map((app) => app.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function toggleSelected(id: string) {
    setBulkMessage(null);
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  }

  function toggleAllVisible() {
    setBulkMessage(null);
    setSelectedIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return [...new Set([...current, ...visibleIds])];
    });
  }

  return (
    <>
      {applicants.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map(({ value, label }) => {
            const count = value === "" ? applicants.length : (countByStatus[value] ?? 0);
            const isActive = (statusFilter ?? "") === value;
            return (
              <Link
                key={value}
                href={value ? `?status=${value}` : "?"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isActive
                    ? "bg-[#006d43] text-white border-[#006d43]"
                    : "bg-white text-[#3d4a41] border-[#e5e2e1] hover:border-[#006d43]/30"
                }`}
              >
                {label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isActive ? "bg-white/20 text-white" : "bg-[#f6f3f2] text-[#3d4a41]"
                }`}>
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="bg-white border border-[#e5e2e1] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-[#3d4a41]">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              className="w-4 h-4 accent-[#006d43]"
            />
            Select all visible
          </label>
          <div className="flex items-center gap-3">
            {bulkMessage && <p className="text-xs text-[#3d4a41]">{bulkMessage}</p>}
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => setShowAssessmentForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              <ClipboardCheck className="w-4 h-4" />
              Send Assessment ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e2e1] p-16 text-center">
          <User className="w-12 h-12 text-[#3d4a41] mx-auto mb-4 opacity-40" />
          <h3 className="font-semibold text-[#1c1b1b] mb-2">
            {statusFilter ? `No ${STATUS_LABELS[statusFilter] ?? statusFilter} applicants` : "No applicants yet"}
          </h3>
          <p className="text-[#3d4a41] text-sm">
            {statusFilter
              ? "Try a different filter or clear it to see all applications."
              : "Applications will appear here once candidates apply."}
          </p>
          {statusFilter && (
            <Link
              href="?"
              className="inline-block mt-4 text-sm text-[#006d43] underline underline-offset-4"
            >
              Clear filter
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => {
            const p = app.profile;
            const jsp = p?.job_seeker_profiles;
            const name = p ? `${p.first_name} ${p.last_name}`.trim() : "Unknown";
            const isSelected = selectedIds.includes(app.id);

            return (
              <div
                key={app.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex items-center gap-5 ${
                  isSelected
                    ? "border-[#006d43]/50 shadow-[0_8px_24px_rgba(0,109,67,0.08)]"
                    : "border-[#e5e2e1] hover:border-[#006d43]/20 hover:shadow-[0_8px_24px_rgba(0,109,67,0.06)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelected(app.id)}
                  aria-label={`Select ${name}`}
                  className="w-4 h-4 accent-[#006d43] shrink-0"
                />

                <div className="w-12 h-12 rounded-full bg-[#f0edec] overflow-hidden shrink-0 flex items-center justify-center">
                  {p?.avatar_url ? (
                    <img src={p.avatar_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-[#3d4a41]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-[#1c1b1b]">{name}</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[app.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {STATUS_LABELS[app.status] ?? app.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#5f5e5e] flex-wrap">
                    {jsp?.degree && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {jsp.degree}{jsp.institution ? ` at ${jsp.institution}` : ""}
                      </span>
                    )}
                    {jsp?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {jsp.location}
                      </span>
                    )}
                    <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <Link
                  href={`/company/applicants/${app.id}`}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#006d43] hover:text-[#00a86b] transition-colors shrink-0"
                >
                  View Profile <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {showAssessmentForm && (
        <AssessmentCreatorModal
          mode="assessment"
          applicationIds={selectedIds}
          templates={templates}
          onClose={() => setShowAssessmentForm(false)}
          onAssessmentSent={(result) => {
            const sentCount = result?.sentCount ?? 0;
            const skippedCount = result?.skippedCount ?? 0;
            setBulkMessage(`Sent ${sentCount} assessment${sentCount === 1 ? "" : "s"}${skippedCount ? `, skipped ${skippedCount}` : ""}.`);
            setSelectedIds([]);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
