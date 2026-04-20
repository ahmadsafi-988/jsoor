import { getCompanyStats, getCompanyJobs, getCompanyAssessments } from "@/lib/company/data";
import { getMyCompany } from "@/lib/company/data";
import { Briefcase, Users, ClipboardCheck, TrendingUp, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

export default async function CompanyHomePage() {
  const [company, stats, recentJobs, recentAssessments] = await Promise.all([
    getMyCompany(),
    getCompanyStats(),
    getCompanyJobs(),
    getCompanyAssessments(),
  ]);

  if (!company) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center py-24">
        <Briefcase className="w-12 h-12 text-[#006d43] mx-auto mb-4" />
        <h2 className="font-headline text-2xl font-bold text-[#1c1b1b] mb-2">
          Complete your company profile
        </h2>
        <p className="text-[#3d4a41] mb-6">Set up your company to start posting jobs and reviewing applicants.</p>
        <Link
          href="/company/onboarding"
          className="inline-flex items-center gap-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white font-semibold px-6 py-3 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[#00a86b]/20"
        >
          Set up company
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const statCards = [
    { label: "Total Jobs", value: stats.totalJobs, icon: Briefcase, color: "bg-blue-50 text-blue-600" },
    { label: "Active Jobs", value: stats.activeJobs, icon: TrendingUp, color: "bg-[#78fbb6]/20 text-[#005232]" },
    { label: "Applications", value: stats.totalApplications, icon: Users, color: "bg-amber-50 text-amber-600" },
    { label: "Pending Assessments", value: stats.pendingAssessments, icon: ClipboardCheck, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
      {/* Welcome */}
      <div>
        <h2 className="font-headline text-[2rem] font-bold text-[#1c1b1b] tracking-tight">
          Welcome back, {company.name}
        </h2>
        <p className="text-[#3d4a41] text-sm mt-1">Here's an overview of your hiring activity.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-6 border border-[#e5e2e1] flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1c1b1b]">{value}</p>
              <p className="text-xs text-[#5f5e5e]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent jobs + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent jobs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e5e2e1] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0edec]">
            <h3 className="font-semibold text-[#1c1b1b]">Recent Jobs</h3>
            <Link href="/company/jobs" className="text-xs text-[#006d43] font-medium hover:underline">
              View all
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#3d4a41] text-sm">
              No jobs posted yet.{" "}
              <Link href="/company/jobs/new" className="text-[#006d43] underline">Post your first job</Link>
            </div>
          ) : (
            <div className="divide-y divide-[#f0edec]">
              {recentJobs.slice(0, 5).map((job) => (
                <Link key={job.id} href={`/company/jobs/${job.id}`}>
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-[#f6f3f2] transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-[#1c1b1b]">{job.title}</p>
                      <p className="text-xs text-[#5f5e5e] mt-0.5">{job.location} · {job.type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${job.is_active ? "bg-[#78fbb6]/20 text-[#005232]" : "bg-[#ebe7e7] text-[#5f5e5e]"}`}>
                        {job.is_active ? "Active" : "Inactive"}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#3d4a41]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-4">
          <Link href="/company/jobs/new">
            <div className="bg-gradient-to-br from-[#006d43] to-[#00a86b] rounded-2xl p-6 cursor-pointer hover:brightness-110 transition-all shadow-lg shadow-[#00a86b]/20">
              <Plus className="w-8 h-8 text-white mb-3" />
              <p className="font-semibold text-white text-base">Post a Job</p>
              <p className="text-[#78fbb6] text-xs mt-1">Reach qualified candidates</p>
            </div>
          </Link>

          <Link href="/company/assessments">
            <div className="bg-white rounded-2xl border border-[#e5e2e1] p-6 cursor-pointer hover:bg-[#f6f3f2] transition-colors">
              <ClipboardCheck className="w-8 h-8 text-[#006d43] mb-3" />
              <p className="font-semibold text-[#1c1b1b] text-base">Assessments</p>
              <p className="text-[#3d4a41] text-xs mt-1">
                {stats.pendingAssessments > 0
                  ? `${stats.pendingAssessments} awaiting submission`
                  : "No pending assessments"}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent assessments */}
      {recentAssessments.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e5e2e1] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0edec]">
            <h3 className="font-semibold text-[#1c1b1b]">Recent Assessments</h3>
            <Link href="/company/assessments" className="text-xs text-[#006d43] font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#f0edec]">
            {recentAssessments.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-[#1c1b1b]">{a.title}</p>
                  <p className="text-xs text-[#5f5e5e] mt-0.5">
                    {(a.application as any)?.profile
                      ? `${(a.application as any).profile.first_name} ${(a.application as any).profile.last_name}`
                      : "Applicant"}{" "}
                    · {(a.application as any)?.job?.title ?? ""}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  a.status === "pending" ? "bg-amber-50 text-amber-700" :
                  a.status === "submitted" ? "bg-blue-50 text-blue-700" :
                  "bg-[#78fbb6]/20 text-[#005232]"
                }`}>
                  {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
