"use client";

import { useState, useTransition } from "react";
import { MapPin, Bookmark, ArrowRight, ChevronDown, Search, Building, Flag } from "lucide-react";
import { applyToJob, saveJob, unsaveJob, reportJob } from "@/lib/company/actions";
import type { JobWithSkillsAndMatch } from "@/lib/company/data";

const TYPE_COLORS: Record<string, string> = {
  "Full-time":  "bg-[#78fbb6]/20 text-[#005232]",
  "Remote":     "bg-blue-100 text-blue-700",
  "Hybrid":     "bg-purple-100 text-purple-700",
  "Internship": "bg-amber-100 text-amber-700",
  "Part-time":  "bg-orange-100 text-orange-700",
  "Contract":   "bg-pink-100 text-pink-700",
};

function MatchBadge({ matchCount, matchTotal }: { matchCount: number; matchTotal: number }) {
  if (matchTotal === 0) return null;
  const ratio = matchCount / matchTotal;
  if (ratio >= 0.7) {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#78fbb6]/30 text-[#005232]">
        Strong Match
      </span>
    );
  }
  if (ratio >= 0.4) {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
        Partial Match
      </span>
    );
  }
  return null;
}

function JobCard({
  job,
  applied,
  saved,
  onApplied,
  onSaveToggle,
}: {
  job: JobWithSkillsAndMatch;
  applied: boolean;
  saved: boolean;
  onApplied: (id: string) => void;
  onSaveToggle: (id: string, saved: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [savePending, setSavePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportPending, setReportPending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportDone, setReportDone] = useState(false);

  function handleApply() {
    startTransition(async () => {
      setError(null);
      const result = await applyToJob(job.id, coverLetter || undefined);
      if (result?.error) {
        setError(result.error);
      } else {
        onApplied(job.id);
        setShowApply(false);
      }
    });
  }

  async function handleSaveToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setSavePending(true);
    const result = saved ? await unsaveJob(job.id) : await saveJob(job.id);
    if (!result?.error) onSaveToggle(job.id, !saved);
    setSavePending(false);
  }

  async function handleReport() {
    if (!reportReason.trim()) return;
    setReportPending(true);
    setReportError(null);
    const result = await reportJob(job.id, reportReason.trim());
    if (result?.error) {
      setReportError(result.error);
    } else {
      setReportDone(true);
      setShowReport(false);
      setReportReason("");
    }
    setReportPending(false);
  }

  const visibleSkills = job.requiredSkills.slice(0, 4);
  const extraSkills = job.requiredSkills.length - visibleSkills.length;

  return (
    <div className="relative group bg-white rounded-2xl p-6 border border-[#e5e2e1] hover:shadow-[0_20px_40px_rgba(0,109,67,0.08)] hover:border-[#006d43]/20 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#006d43]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#f6f3f2] overflow-hidden shrink-0 flex items-center justify-center">
            {job.company?.logo_url ? (
              <img src={job.company.logo_url} alt={job.company.name} className="w-full h-full object-cover" />
            ) : (
              <Building className="w-6 h-6 text-[#3d4a41]" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSaveToggle}
              disabled={savePending}
              className={`p-1.5 rounded-full transition-colors disabled:opacity-50 ${
                saved
                  ? "text-[#006d43] bg-[#78fbb6]/20"
                  : "text-neutral-400 hover:text-[#006d43] hover:bg-[#f6f3f2]"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
            </button>
            {!reportDone ? (
              <button
                onClick={() => { setShowReport((s) => !s); setShowApply(false); }}
                title="Report this job"
                className="p-1.5 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Flag className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-[10px] text-red-500 font-medium px-1.5">Reported</span>
            )}
          </div>
        </div>

        {/* Title + company + match badge */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[#1c1b1b] text-base leading-snug group-hover:text-[#006d43] transition-colors">
              {job.title}
            </h3>
            <MatchBadge matchCount={job.matchCount} matchTotal={job.matchTotal} />
          </div>
          <p className="text-sm text-[#5f5e5e] mt-0.5">{job.company?.name ?? "Company"}</p>
        </div>

        {/* Location + type */}
        <div className="flex items-center gap-2 flex-wrap">
          {job.location && (
            <span className="flex items-center gap-1 text-xs text-[#3d4a41]">
              <MapPin className="w-3.5 h-3.5" /> {job.location}
            </span>
          )}
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[job.type] ?? "bg-gray-100 text-gray-600"}`}>
            {job.type}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-[#5f5e5e] leading-relaxed line-clamp-2">{job.description}</p>

        {/* Required skill tags */}
        {visibleSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleSkills.map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-[#f6f3f2] border border-[#e5e2e1] text-[#3d4a41]">
                {s}
              </span>
            ))}
            {extraSkills > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#f6f3f2] border border-[#e5e2e1] text-[#5f5e5e]">
                +{extraSkills} more
              </span>
            )}
          </div>
        )}

        {/* Salary + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f0edec]">
          <span className="text-sm font-semibold text-[#1c1b1b]">
            {job.salary_range ?? "Salary not specified"}
          </span>
          {applied ? (
            <span className="text-xs font-semibold text-[#005232] bg-[#78fbb6]/20 px-3 py-1.5 rounded-lg">
              Applied
            </span>
          ) : (
            <button
              onClick={() => setShowApply((s) => !s)}
              className="bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:brightness-110 transition-all shadow-[0_8px_16px_rgba(0,109,67,0.15)] flex items-center gap-1.5"
            >
              Apply <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Inline apply form */}
        {showApply && !applied && (
          <div className="border-t border-[#f0edec] pt-4 flex flex-col gap-3">
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={3}
              placeholder="Optional: Add a brief cover letter..."
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 resize-none"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setShowApply(false)}
                className="flex-1 py-2 rounded-lg border border-[#e5e2e1] text-sm text-[#3d4a41] hover:bg-[#f6f3f2] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isPending}
                className="flex-1 py-2 rounded-lg bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
              >
                {isPending ? "Applying..." : "Submit"}
              </button>
            </div>
          </div>
        )}

        {/* Inline report form */}
        {showReport && !reportDone && (
          <div className="border-t border-[#f0edec] pt-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-red-600">Report this job listing</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
              placeholder="Describe the issue (e.g. misleading, spam, inappropriate)..."
              className="w-full bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] px-3 py-2.5 text-sm text-[#1c1b1b] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
            />
            {reportError && <p className="text-xs text-red-600">{reportError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowReport(false); setReportReason(""); setReportError(null); }}
                className="flex-1 py-2 rounded-lg border border-[#e5e2e1] text-sm text-[#3d4a41] hover:bg-[#f6f3f2] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reportPending || !reportReason.trim()}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
              >
                {reportPending ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type Props = {
  initialJobs: JobWithSkillsAndMatch[];
  initialAppliedIds: string[];
  initialSavedIds: string[];
};

const PAGE_SIZE = 9;

export function JobSeekerHomeClient({ initialJobs, initialAppliedIds, initialSavedIds }: Props) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [appliedIds, setAppliedIds] = useState(new Set(initialAppliedIds));
  const [savedIds, setSavedIds] = useState(new Set(initialSavedIds));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filters = ["All", "Best Match", "Full-time", "Remote", "Hybrid", "Internship"];

  const allFiltered = initialJobs.filter((j) => {
    if (filter === "Best Match") {
      if (j.matchTotal === 0 || j.matchCount / j.matchTotal < 0.5) return false;
    } else if (filter !== "All") {
      if (j.type !== filter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        (j.company?.name ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const displayed = allFiltered.slice(0, visibleCount);
  const hasMore = allFiltered.length > visibleCount;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Hero search */}
      <section className="relative mb-10 rounded-[1.5rem] bg-white border border-[#e5e2e1] p-8 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#78fbb6] rounded-full blur-[80px] opacity-20 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-headline text-[2rem] font-bold text-[#1c1b1b] tracking-tight leading-tight mb-2">
            Find Your Next Opportunity
          </h2>
          <p className="text-[#3d4a41] text-sm mb-6">
            Tailored roles matched to your profile — updated daily.
          </p>
          <div className="flex items-center bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] overflow-hidden pr-2 gap-2">
            <Search className="w-5 h-5 text-neutral-400 shrink-0 ml-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
              placeholder="Search roles, companies, or skills..."
              className="flex-1 py-3.5 px-3 bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-[#1c1b1b] placeholder:text-neutral-400"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setVisibleCount(PAGE_SIZE); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#006d43] text-white"
                  : "bg-[#f6f3f2] text-[#3d4a41] hover:bg-[#e5e2e1] hover:text-[#1c1b1b]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-[#3d4a41] uppercase tracking-widest">
          {allFiltered.length} opportunities
        </span>
      </div>

      <h3 className="font-headline text-base font-semibold text-[#1c1b1b] mb-4">
        {filter === "Best Match"
          ? "Jobs matching your skills"
          : search
          ? `Results for "${search}"`
          : "Recommended for you"}
      </h3>

      {allFiltered.length === 0 ? (
        <div className="text-center py-16 text-[#3d4a41]">
          <p className="text-lg font-semibold text-[#1c1b1b] mb-2">No jobs found</p>
          <p className="text-sm">
            {filter === "Best Match"
              ? "Add skills to your profile to see matched jobs here."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              applied={appliedIds.has(job.id)}
              saved={savedIds.has(job.id)}
              onApplied={(id) => setAppliedIds((s) => new Set([...s, id]))}
              onSaveToggle={(id, isSaved) =>
                setSavedIds((s) => {
                  const next = new Set(s);
                  isSaved ? next.add(id) : next.delete(id);
                  return next;
                })
              }
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="flex items-center gap-2 px-8 py-3.5 border border-[#bccabe] text-[#006d43] font-semibold text-sm rounded-xl hover:bg-[#f6f3f2] transition-colors"
          >
            Show More Opportunities <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
