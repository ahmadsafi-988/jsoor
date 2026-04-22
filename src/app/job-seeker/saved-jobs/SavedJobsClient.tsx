"use client";

import { useState, useTransition } from "react";
import { unsaveJob, applyToJob } from "@/lib/company/actions";
import { MapPin, Building, Bookmark, ArrowRight } from "lucide-react";
import type { JobWithCompany } from "@/lib/company/data";

const TYPE_COLORS: Record<string, string> = {
  "Full-time":  "bg-[#78fbb6]/20 text-[#005232]",
  "Remote":     "bg-blue-100 text-blue-700",
  "Hybrid":     "bg-purple-100 text-purple-700",
  "Internship": "bg-amber-100 text-amber-700",
  "Part-time":  "bg-orange-100 text-orange-700",
  "Contract":   "bg-pink-100 text-pink-700",
};

type Props = {
  initialJobs: JobWithCompany[];
  appliedJobIds: string[];
};

export function SavedJobsClient({ initialJobs, appliedJobIds }: Props) {
  const [jobs, setJobs] = useState(initialJobs);
  const [appliedIds, setAppliedIds] = useState(new Set(appliedJobIds));
  const [unsaving, setUnsaving] = useState<string | null>(null);
  const [applying, startApplying] = useTransition();
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showCoverLetter, setShowCoverLetter] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleUnsave(jobId: string) {
    setUnsaving(jobId);
    const result = await unsaveJob(jobId);
    if (!result?.error) {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    }
    setUnsaving(null);
  }

  function handleApply(jobId: string) {
    setApplyingId(jobId);
    setError(null);
    startApplying(async () => {
      const result = await applyToJob(jobId, coverLetter || undefined);
      if (result?.error) {
        setError(result.error);
      } else {
        setAppliedIds((prev) => new Set([...prev, jobId]));
        setShowCoverLetter(null);
        setCoverLetter("");
      }
      setApplyingId(null);
    });
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e5e2e1] p-16 text-center">
        <Bookmark className="w-12 h-12 text-[#3d4a41] mx-auto mb-4 opacity-40" />
        <h3 className="font-semibold text-[#1c1b1b] mb-2">No saved jobs yet</h3>
        <p className="text-[#3d4a41] text-sm">
          Browse jobs and click the bookmark icon to save them here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {jobs.map((job) => {
        const isApplied = appliedIds.has(job.id);
        const isUnsaving = unsaving === job.id;
        const showForm = showCoverLetter === job.id;

        return (
          <div
            key={job.id}
            className="bg-white rounded-2xl border border-[#e5e2e1] hover:border-[#006d43]/20 hover:shadow-[0_8px_24px_rgba(0,109,67,0.06)] transition-all p-6 flex flex-col gap-4"
          >
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="w-12 h-12 rounded-xl bg-[#f6f3f2] overflow-hidden shrink-0 flex items-center justify-center">
                {job.company?.logo_url ? (
                  <img src={job.company.logo_url} alt={job.company.name} className="w-full h-full object-cover" />
                ) : (
                  <Building className="w-6 h-6 text-[#3d4a41]" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#1c1b1b]">{job.title}</h3>
                <p className="text-sm text-[#5f5e5e] mt-0.5">{job.company?.name ?? "Company"}</p>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {job.location && (
                    <span className="flex items-center gap-1 text-xs text-[#3d4a41]">
                      <MapPin className="w-3.5 h-3.5" /> {job.location}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[job.type] ?? "bg-gray-100 text-gray-600"}`}>
                    {job.type}
                  </span>
                  {job.salary_range && (
                    <span className="text-xs font-semibold text-[#1c1b1b]">{job.salary_range}</span>
                  )}
                </div>
              </div>

              {/* Unsave button */}
              <button
                onClick={() => handleUnsave(job.id)}
                disabled={isUnsaving}
                title="Remove from saved"
                className="p-1.5 rounded-full text-[#006d43] bg-[#78fbb6]/20 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            </div>

            <p className="text-sm text-[#5f5e5e] leading-relaxed line-clamp-2">{job.description}</p>

            {/* Actions */}
            <div className="flex items-center justify-end pt-2 border-t border-[#f0edec]">
              {isApplied ? (
                <span className="text-xs font-semibold text-[#005232] bg-[#78fbb6]/20 px-3 py-1.5 rounded-lg">
                  Applied
                </span>
              ) : (
                <button
                  onClick={() => setShowCoverLetter(showForm ? null : job.id)}
                  className="bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:brightness-110 transition-all shadow-[0_8px_16px_rgba(0,109,67,0.15)] flex items-center gap-1.5"
                >
                  Apply <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Inline apply form */}
            {showForm && !isApplied && (
              <div className="border-t border-[#f0edec] pt-4 flex flex-col gap-3">
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={3}
                  placeholder="Optional: Add a brief cover letter..."
                  className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
                />
                {error && applyingId === job.id && (
                  <p className="text-xs text-red-600">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowCoverLetter(null); setCoverLetter(""); }}
                    className="flex-1 py-2 rounded-lg border border-[#e5e2e1] text-sm text-[#3d4a41] hover:bg-[#f6f3f2] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={applying && applyingId === job.id}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
                  >
                    {applying && applyingId === job.id ? "Applying..." : "Submit"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
