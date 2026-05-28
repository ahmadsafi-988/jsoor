import Link from "next/link";
import { Banknote, Building2, Calendar, MapPin } from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { DashboardBackButton } from "@/components/app/DashboardBackButton";
import type { CanonicalJob } from "@/lib/company/data";

type Props = {
  job: CanonicalJob;
  backHref: string;
  companyHref: string;
};

export function JobDetailContent({ job, backHref, companyHref }: Props) {
  return (
    <div className="px-6 py-8">
      <article className="mx-auto max-w-4xl">
        <DashboardBackButton fallbackHref={backHref} />

        <div className="rounded-2xl border border-[#e5e2e1] bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <Link
              href={companyHref}
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white p-2 transition-colors hover:border-[#006d43]/40"
            >
              {job.company?.logo_url ? (
                <ImageWithFallback
                  src={job.company.logo_url}
                  alt={job.company.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-7 w-7 text-[#3d4a41]" />
              )}
            </Link>
            <div className="min-w-0">
              <h1 className="font-headline text-3xl font-bold tracking-tight text-[#1c1b1b]">
                {job.title}
              </h1>
              {job.company && (
                <Link
                  href={companyHref}
                  className="mt-1 inline-flex text-sm font-medium text-[#006d43] hover:underline"
                >
                  {job.company.name}
                </Link>
              )}
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {job.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-1.5 text-xs text-[#3d4a41]">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            <span className="rounded-full bg-[#78fbb6]/20 px-3 py-1.5 text-xs font-semibold text-[#005232]">
              {job.type}
            </span>
            {job.salary_range && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-1.5 text-xs text-[#3d4a41]">
                <Banknote className="h-3.5 w-3.5" />
                {job.salary_range}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-1.5 text-xs text-[#5f5e5e]">
              <Calendar className="h-3.5 w-3.5" />
              Posted {new Date(job.created_at).toLocaleDateString()}
            </span>
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
              About the Role
            </h2>
            <p className="whitespace-pre-line text-sm leading-7 text-[#3d4a41]">
              {job.description}
            </p>
          </section>

          {job.requirements && (
            <section className="mb-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                Requirements
              </h2>
              <p className="whitespace-pre-line text-sm leading-7 text-[#3d4a41]">
                {job.requirements}
              </p>
            </section>
          )}

          {job.requiredSkills.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[#78fbb6]/40 bg-[#f0f9f5] px-3 py-1.5 text-xs font-medium text-[#005232]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
