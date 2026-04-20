import { getCompanyJobs, getMyCompany } from "@/lib/company/data";
import { Briefcase, Plus, MapPin, Users, ArrowRight, ToggleLeft } from "lucide-react";
import Link from "next/link";

const TYPE_COLORS: Record<string, string> = {
  "Full-time": "bg-[#78fbb6]/20 text-[#005232]",
  "Remote": "bg-blue-100 text-blue-700",
  "Hybrid": "bg-purple-100 text-purple-700",
  "Part-time": "bg-amber-100 text-amber-700",
  "Contract": "bg-orange-100 text-orange-700",
  "Internship": "bg-pink-100 text-pink-700",
};

export default async function CompanyJobsPage() {
  const [company, jobs] = await Promise.all([getMyCompany(), getCompanyJobs()]);

  if (!company) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center py-24">
        <p className="text-[#3d4a41] mb-4">Complete your company profile first.</p>
        <Link href="/company/onboarding" className="text-[#006d43] underline font-medium">
          Set up company
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">Jobs</h2>
          <p className="text-[#3d4a41] text-sm mt-1">Manage your job postings.</p>
        </div>
        <Link
          href="/company/jobs/new"
          className="inline-flex items-center gap-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold px-5 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[#00a86b]/20 text-sm"
        >
          <Plus className="w-4 h-4" />
          Post a Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e2e1] p-16 text-center">
          <Briefcase className="w-12 h-12 text-[#3d4a41] mx-auto mb-4 opacity-40" />
          <h3 className="font-semibold text-[#1c1b1b] mb-2">No jobs posted yet</h3>
          <p className="text-[#3d4a41] text-sm mb-6">Start attracting top talent by posting your first job.</p>
          <Link
            href="/company/jobs/new"
            className="inline-flex items-center gap-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold px-6 py-3 rounded-xl hover:brightness-110 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Post your first job
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border border-[#e5e2e1] hover:border-[#006d43]/20 hover:shadow-[0_8px_24px_rgba(0,109,67,0.06)] transition-all overflow-hidden">
              <div className="flex items-center justify-between p-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[#1c1b1b] text-base">{job.title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_COLORS[job.type] ?? "bg-gray-100 text-gray-600"}`}>
                      {job.type}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${job.is_active ? "bg-[#78fbb6]/20 text-[#005232]" : "bg-[#ebe7e7] text-[#5f5e5e]"}`}>
                      {job.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#5f5e5e]">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                      </span>
                    )}
                    {job.salary_range && <span>{job.salary_range}</span>}
                    <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <Link
                    href={`/company/jobs/${job.id}/applicants`}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#006d43] hover:text-[#00a86b] transition-colors px-3 py-1.5 rounded-lg border border-[#006d43]/30 hover:bg-[#006d43]/5"
                  >
                    <Users className="w-3.5 h-3.5" /> Applicants
                  </Link>
                  <Link
                    href={`/company/jobs/${job.id}`}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#3d4a41] hover:bg-[#e5e2e1] hover:text-[#1c1b1b] transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
