import { notFound, redirect } from "next/navigation";
import { ApplicationDetailContent } from "@/components/app/details/ApplicationDetailContent";
import { getCanonicalApplicationDetail } from "@/lib/company/data";
import { createClient } from "@/lib/supabase/server";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
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

  const { applicationId } = await params;
  const detail = await getCanonicalApplicationDetail(applicationId);
  if (!detail?.isAdmin) notFound();

  return (
    <ApplicationDetailContent
      detail={detail}
      backHref="/admin"
      companyHref={detail.company ? `/admin/companies/${detail.company.id}` : "/admin"}
      applicantHref={
        detail.applicant?.username
          ? `/admin/users/${detail.applicant.username}`
          : null
      }
    />
  );
}
