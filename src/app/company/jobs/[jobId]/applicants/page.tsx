import { notFound } from "next/navigation";
import { getJobApplicants, getJobById } from "@/lib/company/data";
import { getCompanyTemplates } from "@/lib/company/templates";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { JobApplicantsClient } from "./JobApplicantsClient";

export default async function JobApplicantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { jobId } = await params;
  const { status: statusFilter } = await searchParams;

  const [job, applicants, templates] = await Promise.all([
    getJobById(jobId),
    getJobApplicants(jobId),
    getCompanyTemplates(),
  ]);

  // getJobById already scopes to company_id === user.id — null means not found or not owned
  if (!job) notFound();

  return (
    <div className="p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href="/company/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-[#3d4a41] hover:text-[#006d43] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
        <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">
          Applicants — {job.title}
        </h2>
        <p className="text-[#3d4a41] text-sm mt-1">
          {applicants.length} application{applicants.length !== 1 ? "s" : ""} total
        </p>
      </div>

      <JobApplicantsClient
        applicants={applicants}
        statusFilter={statusFilter}
        templates={templates}
      />
    </div>
  );
}
