import { notFound } from "next/navigation";
import { ApplicationDetailContent } from "@/components/app/details/ApplicationDetailContent";
import { getCanonicalApplicationDetail } from "@/lib/company/data";

export default async function JobSeekerApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const detail = await getCanonicalApplicationDetail(applicationId);
  if (!detail?.isOwnApplication) notFound();

  return (
    <ApplicationDetailContent
      detail={detail}
      backHref="/job-seeker/job-applications"
      companyHref={detail.company ? `/job-seeker/companies/${detail.company.id}` : "/job-seeker/home"}
      applicantHref={
        detail.applicant?.username
          ? `/job-seeker/profile/${detail.applicant.username}`
          : null
      }
    />
  );
}
