import Link from "next/link";
import { Briefcase, Building2, Calendar, FileText, User } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { DashboardBackButton } from "@/components/app/DashboardBackButton";
import type { CanonicalApplicationDetail } from "@/lib/company/data";

const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  under_review: "Under Review",
  assessment_sent: "Assessment Sent",
  assessment_completed: "Assessment Done",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
};

const STATUS_STYLES: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  assessment_sent: "bg-purple-50 text-purple-700",
  assessment_completed: "bg-[#78fbb6]/20 text-[#005232]",
  shortlisted: "bg-[#006d43]/10 text-[#006d43]",
  accepted: "bg-emerald-500/15 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

type Props = {
  detail: CanonicalApplicationDetail;
  backHref: string;
  companyHref: string;
  applicantHref: string | null;
  showApplicantProfileAction?: boolean;
};

export function ApplicationDetailContent({
  detail,
  backHref,
  companyHref,
  applicantHref,
  showApplicantProfileAction = true,
}: Props) {
  const { application, job, company, applicant, applicantProfile } = detail;
  const applicantName = applicant
    ? `${applicant.first_name} ${applicant.last_name}`.trim() || applicant.username
    : "Applicant";

  return (
    <div className="px-6 py-8">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <DashboardBackButton fallbackHref={backHref} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#3d4a41] transition-colors hover:text-[#006d43]" />

        <section className="rounded-2xl border border-[#e5e2e1] bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span
                className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  STATUS_STYLES[application.status] ?? "bg-neutral-100 text-neutral-600"
                }`}
              >
                {STATUS_LABELS[application.status] ?? application.status}
              </span>
              <h1 className="font-headline text-3xl font-bold tracking-tight text-[#1c1b1b]">
                {job?.title ?? "Application"}
              </h1>
              {company && (
                <Link
                  href={companyHref}
                  className="mt-1 inline-flex text-sm font-medium text-[#006d43] hover:underline"
                >
                  {company.name}
                </Link>
              )}
            </div>
            <Link
              href={companyHref}
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white p-2 transition-colors hover:border-[#006d43]/40"
            >
              {company?.logo_url ? (
                <ImageWithFallback
                  src={company.logo_url}
                  alt={company.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-6 w-6 text-[#3d4a41]" />
              )}
            </Link>
          </div>

          <div className="grid gap-4 border-y border-[#f0edec] py-5 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[#006d43]" />
              <div>
                <p className="text-xs text-[#5f5e5e]">Applied</p>
                <p className="text-sm font-semibold text-[#1c1b1b]">
                  {new Date(application.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-[#006d43]" />
              <div>
                <p className="text-xs text-[#5f5e5e]">Type</p>
                <p className="text-sm font-semibold text-[#1c1b1b]">{job?.type ?? "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-[#006d43]" />
              <div>
                <p className="text-xs text-[#5f5e5e]">Applicant</p>
                <p className="text-sm font-semibold text-[#1c1b1b]">{applicantName}</p>
              </div>
            </div>
          </div>

          <div
            className={`mt-6 grid gap-6 ${
              showApplicantProfileAction ? "lg:grid-cols-[1fr_280px]" : ""
            }`}
          >
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                Cover Letter
              </h2>
              <div className="rounded-xl bg-[#f6f3f2] p-4 text-sm leading-7 text-[#3d4a41]">
                {application.cover_letter ? (
                  <p className="whitespace-pre-line">{application.cover_letter}</p>
                ) : (
                  <p className="italic text-[#5f5e5e]">No cover letter was submitted.</p>
                )}
              </div>
            </section>

            {showApplicantProfileAction && (
              <aside className="rounded-xl border border-[#e5e2e1] p-4">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                  Public Profile
                </h2>
                {applicantHref ? (
                  <Link
                    href={applicantHref}
                    className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#006d43] hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View profile
                  </Link>
                ) : (
                  <p className="mb-3 text-sm text-[#5f5e5e]">Profile link unavailable.</p>
                )}
                <div className="space-y-2 text-sm text-[#3d4a41]">
                  {applicantProfile?.degree && <p>{applicantProfile.degree}</p>}
                  {applicantProfile?.institution && <p>{applicantProfile.institution}</p>}
                  {applicantProfile?.location && <p>{applicantProfile.location}</p>}
                </div>
              </aside>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
