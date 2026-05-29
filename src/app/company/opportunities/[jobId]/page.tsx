import { notFound } from "next/navigation";
import { JobDetailContent } from "@/components/app/details/JobDetailContent";
import { getCanonicalJobById } from "@/lib/company/data";

export default async function CompanyOpportunityDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await getCanonicalJobById(jobId);
  if (!job) notFound();

  return (
    <JobDetailContent
      job={job}
      backHref="/company/home"
      companyHref={`/company/companies/${job.company_id}`}
    />
  );
}
