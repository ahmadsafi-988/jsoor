"use client";

import { useState, useEffect, useTransition } from "react";
import { MapPin, Bookmark, ArrowRight, Star, ChevronDown, Search, Building } from "lucide-react";
import { applyToJob } from "@/lib/company/actions";
import { createClient } from "@/lib/supabase/client";

const TYPE_COLORS: Record<string, string> = {
  "Full-time": "bg-[#78fbb6]/20 text-[#005232]",
  "Remote":    "bg-blue-100 text-blue-700",
  "Hybrid":    "bg-purple-100 text-purple-700",
  "Internship":"bg-amber-100 text-amber-700",
  "Part-time": "bg-orange-100 text-orange-700",
  "Contract":  "bg-pink-100 text-pink-700",
};

type JobWithCompany = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  type: string;
  salary_range: string | null;
  created_at: string;
  company: { name: string; logo_url: string | null } | null;
};

function JobCard({ job, applied, onApplied }: { job: JobWithCompany; applied: boolean; onApplied: (id: string) => void }) {
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

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
          <button
            onClick={(e) => { e.stopPropagation(); setSaved(s => !s); }}
            className={`p-1.5 rounded-full transition-colors ${saved ? "text-[#006d43] bg-[#78fbb6]/20" : "text-neutral-400 hover:text-[#006d43] hover:bg-[#f6f3f2]"}`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Title + company */}
        <div>
          <h3 className="font-semibold text-[#1c1b1b] text-base leading-snug group-hover:text-[#006d43] transition-colors">
            {job.title}
          </h3>
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

        {/* Salary + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f0edec]">
          <span className="text-sm font-semibold text-[#1c1b1b]">{job.salary_range ?? "Salary not specified"}</span>
          {applied ? (
            <span className="text-xs font-semibold text-[#005232] bg-[#78fbb6]/20 px-3 py-1.5 rounded-lg">
              Applied
            </span>
          ) : (
            <button
              onClick={() => setShowApply(s => !s)}
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
              onChange={e => setCoverLetter(e.target.value)}
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
      </div>
    </div>
  );
}

export default function JobSeekerHomePage() {
  const [filter, setFilter] = useState("All");
  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const filters = ["All", "Full-time", "Remote", "Hybrid"];

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("jobs")
        .select(`*, company:companies!jobs_company_id_fkey(name, logo_url)`)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setJobs((data as any[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const displayed = jobs.filter(j => {
    const matchesFilter = filter === "All" || j.type === filter;
    const matchesSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || (j.company?.name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Hero search */}
      <section className="relative mb-10 rounded-[1.5rem] bg-white border border-[#e5e2e1] p-8 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#78fbb6] rounded-full blur-[80px] opacity-20 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-headline text-[2rem] font-bold text-[#1c1b1b] tracking-tight leading-tight mb-2">
            Find Your Next Opportunity
          </h2>
          <p className="text-[#3d4a41] text-sm mb-6">Tailored roles matched to your profile — updated daily.</p>
          <div className="flex items-center bg-[#f6f3f2] rounded-xl border border-[#e5e2e1] overflow-hidden pr-2 gap-2">
            <Search className="w-5 h-5 text-neutral-400 shrink-0 ml-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search roles, companies, or skills..."
              className="flex-1 py-3.5 px-3 bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-[#1c1b1b] placeholder:text-neutral-400"
            />
            <button className="hero-gradient-bg text-white text-sm font-semibold px-6 py-3 rounded-lg shrink-0 hover:brightness-110 transition-all">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f ? "bg-[#e5e2e1] text-[#1c1b1b]" : "bg-[#f6f3f2] text-[#3d4a41] hover:bg-[#e5e2e1] hover:text-[#1c1b1b]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-[#3d4a41] uppercase tracking-widest">
          {loading ? "Loading..." : `${displayed.length} opportunities`}
        </span>
      </div>

      <h3 className="font-headline text-base font-semibold text-[#1c1b1b] mb-4">
        {search ? `Results for "${search}"` : "Recommended for you"}
      </h3>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-[#e5e2e1] p-6 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-[#f0edec] mb-4" />
              <div className="h-4 bg-[#f0edec] rounded mb-2 w-3/4" />
              <div className="h-3 bg-[#f0edec] rounded mb-4 w-1/2" />
              <div className="h-3 bg-[#f0edec] rounded mb-1 w-full" />
              <div className="h-3 bg-[#f0edec] rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-[#3d4a41]">
          <p className="text-lg font-semibold text-[#1c1b1b] mb-2">No jobs found</p>
          <p className="text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayed.map(job => (
            <JobCard
              key={job.id}
              job={job}
              applied={appliedIds.has(job.id)}
              onApplied={(id) => setAppliedIds(s => new Set([...s, id]))}
            />
          ))}
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button className="flex items-center gap-2 px-8 py-3.5 border border-[#bccabe] text-[#006d43] font-semibold text-sm rounded-xl hover:bg-[#f6f3f2] transition-colors">
            Show More Opportunities <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
