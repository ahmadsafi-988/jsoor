import { notFound } from "next/navigation";
import { JobDetailContent } from "@/components/app/details/JobDetailContent";
import { getCanonicalJobById } from "@/lib/company/data";

export default async function JobSeekerJobDetailPage({
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
      backHref="/job-seeker/home"
      companyHref={`/job-seeker/companies/${job.company_id}`}
    />
  );
}
