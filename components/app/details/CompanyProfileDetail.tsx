import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Globe,
  MapPin,
  Users,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { DashboardBackButton } from "@/components/app/DashboardBackButton";
import { ImagePreviewDialog } from "@/components/app/ImagePreviewDialog";
import type { PublicCompanyProfile } from "@/lib/company/data";
import type { ReactNode } from "react";

type Props = {
  result: PublicCompanyProfile;
  backHref: string;
  jobHrefPrefix: string;
  messageAction?: ReactNode;
};

export function CompanyProfileDetail({
  result,
  backHref,
  jobHrefPrefix,
  messageAction,
}: Props) {
  const { company, jobs } = result;

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <DashboardBackButton fallbackHref={backHref} />

        <div className="overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-br from-[#006d43] via-[#008a55] to-[#00c47a]">
            {company.cover_url && (
              <ImagePreviewDialog
                src={company.cover_url}
                alt={`${company.name} company cover`}
                label="company cover"
                triggerClassName="block h-full w-full cursor-zoom-in"
              >
                <ImageWithFallback
                  src={company.cover_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </ImagePreviewDialog>
            )}
          </div>
          <div className="px-6 pb-6">
            <div className="-mt-12 mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white p-2 shadow-md">
                  {company.logo_url ? (
                    <ImagePreviewDialog
                      src={company.logo_url}
                      alt={`${company.name} logo`}
                      label="company logo"
                      triggerClassName="block h-full w-full cursor-zoom-in rounded-xl"
                    >
                      <ImageWithFallback
                        src={company.logo_url}
                        alt={company.name}
                        className="h-full w-full object-contain"
                      />
                    </ImagePreviewDialog>
                  ) : (
                    <Building2 className="h-10 w-10 text-[#3d4a41]" />
                  )}
                </div>
                <div className="pb-1">
                  <h1 className="font-headline text-3xl font-bold tracking-tight text-[#1c1b1b]">
                    {company.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#3d4a41]">
                    {company.industry && <span>{company.industry}</span>}
                    {company.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {company.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {messageAction}
            </div>

            {company.description ? (
              <p className="max-w-3xl text-sm leading-7 text-[#3d4a41]">
                {company.description}
              </p>
            ) : (
              <p className="text-sm text-[#5f5e5e]">
                No company description available yet.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
              Company Details
            </h2>
            <div className="space-y-4 text-sm">
              {company.website && (
                <a
                  href={
                    company.website.startsWith("http")
                      ? company.website
                      : `https://${company.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#006d43] hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              {company.size && (
                <div className="flex items-center gap-2 text-[#3d4a41]">
                  <Users className="h-4 w-4 text-[#006d43]" />
                  {company.size} employees
                </div>
              )}
              {company.founded_year && (
                <div className="flex items-center gap-2 text-[#3d4a41]">
                  <Calendar className="h-4 w-4 text-[#006d43]" />
                  Founded {company.founded_year}
                </div>
              )}
            </div>
          </aside>

          <section className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                Open Opportunities
              </h2>
              <span className="text-xs font-semibold text-[#006d43]">
                {jobs.length} active
              </span>
            </div>

            {jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`${jobHrefPrefix}/${job.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[#e5e2e1] p-4 transition-colors hover:border-[#006d43]/30 hover:bg-[#f6f3f2]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1c1b1b]">{job.title}</p>
                      <p className="mt-1 text-xs text-[#5f5e5e]">
                        {[job.type, job.location, job.salary_range].filter(Boolean).join(" - ")}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[#006d43]" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-[#5f5e5e]">
                <Briefcase className="mx-auto mb-3 h-8 w-8 opacity-40" />
                No public opportunities right now.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
