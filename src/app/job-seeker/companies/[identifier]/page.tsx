import { notFound } from "next/navigation";
import { CompanyProfileDetail } from "@/components/app/details/CompanyProfileDetail";
import { MessageActionButton } from "@/components/app/MessageActionButton";
import { getPublicCompanyByIdentifier } from "@/lib/company/data";

export default async function JobSeekerCompanyProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const { identifier } = await params;
  const { applicationId } = await searchParams;
  const result = await getPublicCompanyByIdentifier(identifier);
  if (!result) notFound();

  return (
    <CompanyProfileDetail
      result={result}
      backHref="/job-seeker/home"
      jobHrefPrefix="/job-seeker/jobs"
      messageAction={
        <MessageActionButton
          mode="job-seeker-company"
          companyId={result.company.id}
          applicationId={applicationId}
          label="Message Company"
        />
      }
    />
  );
}
