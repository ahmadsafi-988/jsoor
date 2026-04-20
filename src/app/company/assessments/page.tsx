import { getCompanyAssessments } from "@/lib/company/data";
import { ClipboardCheck, User, ArrowRight } from "lucide-react";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700",
  submitted: "bg-blue-50 text-blue-700",
  reviewed:  "bg-[#78fbb6]/20 text-[#005232]",
};

const TABS = ["All", "Pending", "Submitted", "Reviewed"] as const;

export default async function CompanyAssessmentsPage() {
  const assessments = await getCompanyAssessments();

  return (
    <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <div>
        <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">Assessments</h2>
        <p className="text-[#3d4a41] text-sm mt-1">Track all assessments you've sent to applicants.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {(["pending", "submitted", "reviewed"] as const).map((status) => {
          const count = assessments.filter(a => a.status === status).length;
          return (
            <div key={status} className="bg-white rounded-2xl border border-[#e5e2e1] p-5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${STATUS_STYLES[status]}`}>
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1c1b1b]">{count}</p>
                <p className="text-xs text-[#5f5e5e] capitalize">{status}</p>
              </div>
            </div>
          );
        })}
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e2e1] p-16 text-center">
          <ClipboardCheck className="w-12 h-12 text-[#3d4a41] mx-auto mb-4 opacity-40" />
          <h3 className="font-semibold text-[#1c1b1b] mb-2">No assessments yet</h3>
          <p className="text-[#3d4a41] text-sm">
            Open an applicant profile and send them an assessment to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-[#3d4a41] uppercase tracking-wider">
            <div className="col-span-3">Assessment</div>
            <div className="col-span-3">Applicant</div>
            <div className="col-span-3">Job</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {assessments.map((a) => {
            const app = (a as any).application;
            const p = app?.profile;
            const name = p ? `${p.first_name} ${p.last_name}`.trim() : "Unknown";

            return (
              <div key={a.id} className="bg-white rounded-2xl border border-[#e5e2e1] hover:border-[#006d43]/20 transition-all">
                <div className="grid grid-cols-12 gap-4 items-center px-6 py-5">
                  <div className="col-span-3">
                    <p className="font-semibold text-[#1c1b1b] text-sm">{a.title}</p>
                    {a.deadline && (
                      <p className="text-xs text-[#5f5e5e] mt-0.5">
                        Due {new Date(a.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#f0edec] overflow-hidden flex items-center justify-center shrink-0">
                      {p?.avatar_url ? (
                        <img src={p.avatar_url} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-[#3d4a41]" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-[#1c1b1b] truncate">{name}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-sm text-[#3d4a41] truncate">{app?.job?.title ?? "—"}</span>
                  </div>
                  <div className="col-span-1">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    {app?.id && (
                      <Link
                        href={`/company/applicants/${app.id}`}
                        className="flex items-center gap-1 text-xs font-medium text-[#006d43] hover:text-[#00a86b] transition-colors"
                      >
                        View <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
                {a.status === "reviewed" && a.score !== null && (
                  <div className="px-6 pb-4">
                    <p className="text-xs text-[#005232] bg-[#78fbb6]/10 rounded-lg px-3 py-2">
                      Score: <strong>{a.score}/100</strong>
                      {a.feedback && ` — ${a.feedback}`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
