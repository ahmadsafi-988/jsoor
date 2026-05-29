import { notFound } from "next/navigation";
import { CompanyProfileDetail } from "@/components/app/details/CompanyProfileDetail";
import { getPublicCompanyByIdentifier } from "@/lib/company/data";

export default async function CompanyDashboardCompanyProfilePage({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = await params;
  const result = await getPublicCompanyByIdentifier(identifier);
  if (!result) notFound();

  return (
    <CompanyProfileDetail
      result={result}
      backHref="/company/home"
      jobHrefPrefix="/company/opportunities"
    />
  );
}
