import { getJobApplicants, getJobById } from "@/lib/company/data";
import { ArrowLeft, User, ArrowRight, MapPin, GraduationCap } from "lucide-react";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  applied:               "bg-blue-50 text-blue-700",
  under_review:          "bg-amber-50 text-amber-700",
  assessment_sent:       "bg-purple-50 text-purple-700",
  assessment_completed:  "bg-[#78fbb6]/20 text-[#005232]",
  shortlisted:           "bg-[#006d43]/10 text-[#006d43]",
  rejected:              "bg-red-50 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  applied:               "Applied",
  under_review:          "Under Review",
  assessment_sent:       "Assessment Sent",
  assessment_completed:  "Assessment Done",
  shortlisted:           "Shortlisted",
  rejected:              "Rejected",
};

export default async function JobApplicantsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const [job, applicants] = await Promise.all([
    getJobById(jobId),
    getJobApplicants(jobId),
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <div>
        <Link href="/company/jobs" className="inline-flex items-center gap-1.5 text-sm text-[#3d4a41] hover:text-[#006d43] mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
        <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">
          Applicants {job ? `— ${job.title}` : ""}
        </h2>
        <p className="text-[#3d4a41] text-sm mt-1">{applicants.length} application{applicants.length !== 1 ? "s" : ""} received</p>
      </div>

      {applicants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e2e1] p-16 text-center">
          <User className="w-12 h-12 text-[#3d4a41] mx-auto mb-4 opacity-40" />
          <h3 className="font-semibold text-[#1c1b1b] mb-2">No applicants yet</h3>
          <p className="text-[#3d4a41] text-sm">Applications will appear here once candidates apply.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {applicants.map((app) => {
            const p = (app as any).profile;
            const name = p ? `${p.first_name} ${p.last_name}`.trim() : "Unknown";
            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-[#e5e2e1] hover:border-[#006d43]/20 hover:shadow-[0_8px_24px_rgba(0,109,67,0.06)] transition-all p-6 flex items-center gap-5"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#f0edec] overflow-hidden shrink-0 flex items-center justify-center">
                  {p?.avatar_url ? (
                    <img src={p.avatar_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-[#3d4a41]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#1c1b1b]">{name}</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[app.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[app.status] ?? app.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#5f5e5e] flex-wrap">
                    {p?.degree && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" /> {p.degree}
                        {p?.institution ? ` at ${p.institution}` : ""}
                      </span>
                    )}
                    {p?.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {p.location}
                      </span>
                    )}
                    <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
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
    </div>
  );
}
