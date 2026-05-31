import { notFound, redirect } from "next/navigation";
import { CompanyProfileDetail } from "@/components/app/details/CompanyProfileDetail";
import { CompanyReviewPanel } from "./CompanyReviewPanel";
import { getPublicCompanyByIdentifier } from "@/lib/company/data";
import { getAdminCompanyVerification } from "@/lib/admin/data";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCompanyProfilePage({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { identifier } = await params;
  const result = await getPublicCompanyByIdentifier(identifier);
  if (!result) notFound();
  const verification = await getAdminCompanyVerification(result.company.id);

  return (
    <>
      <div className="px-6 pt-8">
        <div className="mx-auto max-w-5xl">
          <CompanyReviewPanel
            companyId={result.company.id}
            companyName={result.company.name}
            isVerified={result.company.is_verified}
            verification={verification}
          />
        </div>
      </div>
      <CompanyProfileDetail
        result={result}
        backHref="/admin/companies"
        jobHrefPrefix="/admin/jobs"
      />
    </>
  );
}
