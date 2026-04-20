"use client";

import { useState, useEffect } from "react";
import { Building, ArrowRight, ClipboardList, X, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type AppStatus = "applied" | "under_review" | "assessment_sent" | "assessment_completed" | "shortlisted" | "rejected";

const STATUS_LABELS: Record<AppStatus, string> = {
  applied:               "Applied",
  under_review:          "Under Review",
  assessment_sent:       "Assessment Sent",
  assessment_completed:  "Assessment Done",
  shortlisted:           "Shortlisted",
  rejected:              "Rejected",
};

const STATUS_TABS = ["All", "Applied", "Under Review", "Assessment Sent", "Assessment Done", "Shortlisted", "Rejected"] as const;

function StatusBadge({ status }: { status: AppStatus }) {
  const styles: Record<AppStatus, string> = {
    applied:               "bg-blue-50 text-blue-700",
    under_review:          "bg-amber-50 text-amber-700",
    assessment_sent:       "bg-purple-50 text-purple-700",
    assessment_completed:  "bg-[#78fbb6]/20 text-[#005232]",
    shortlisted:           "bg-[#006d43]/10 text-[#006d43]",
    rejected:              "bg-red-50 text-red-600",
  };
  const icons: Partial<Record<AppStatus, React.ReactNode>> = {
    assessment_sent: <ClipboardList className="w-3.5 h-3.5" />,
    rejected: <X className="w-3.5 h-3.5" />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {icons[status]}
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function JobApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("job_applications")
        .select(`*, job:jobs!job_applications_job_id_fkey(*, company:companies!jobs_company_id_fkey(name, logo_url))`)
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false });
      setApplications(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = activeTab === "All"
    ? applications
    : applications.filter(a => STATUS_LABELS[a.status as AppStatus] === activeTab);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">My Applications</h2>
        <p className="text-[#3d4a41] text-sm">Track and manage your career opportunities.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-[#e5e2e1] text-[#1c1b1b]"
                : "bg-[#f6f3f2] text-[#3d4a41] hover:bg-[#e5e2e1] hover:text-[#1c1b1b]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-[#e5e2e1]" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-[#3d4a41] uppercase tracking-wider">
            <div className="col-span-5">Role &amp; Company</div>
            <div className="col-span-3">Date Applied</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#3d4a41] text-sm">
              {applications.length === 0
                ? <>No applications yet. <Link href="/job-seeker/home" className="text-[#006d43] underline">Browse jobs</Link></>
                : "No applications in this category."}
            </div>
          )}

          {filtered.map(app => {
            const job = app.job;
            const company = job?.company;
            const isAssessmentSent = app.status === "assessment_sent";

            return (
              <div
                key={app.id}
                className={`relative grid grid-cols-12 gap-4 items-center px-6 py-5 bg-white rounded-xl hover:bg-[#f6f3f2] transition-colors duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden ${
                  app.status === "rejected" ? "opacity-70" : ""
                }`}
              >
                {isAssessmentSent && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
                )}

                {/* Role & Company */}
                <div className="col-span-5 flex items-center gap-4 relative z-10">
                  <div className="w-11 h-11 rounded-lg bg-[#f0edec] flex items-center justify-center shrink-0 overflow-hidden">
                    {company?.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-5 h-5 text-[#006d43]" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-[#1c1b1b] text-sm truncate">{job?.title ?? "Unknown Job"}</span>
                    <span className="text-[#3d4a41] text-xs truncate">{company?.name ?? "Unknown Company"}</span>
                  </div>
                </div>

                {/* Date */}
                <div className="col-span-3 relative z-10">
                  <span className="text-[#1c1b1b] text-sm">
                    {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center relative z-10">
                  <StatusBadge status={app.status as AppStatus} />
                </div>

                {/* Action */}
                <div className="col-span-2 flex justify-end relative z-10">
                  {isAssessmentSent ? (
                    <Link
                      href="/job-seeker/assessments"
                      className="px-4 py-2 rounded-lg bg-[#006d43] text-white text-xs font-semibold hover:bg-[#00a86b] transition-colors shadow-[0_8px_16px_rgba(0,109,67,0.1)]"
                    >
                      View Task
                    </Link>
                  ) : (
                    <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#3d4a41] hover:bg-[#e5e2e1] hover:text-[#1c1b1b] transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
