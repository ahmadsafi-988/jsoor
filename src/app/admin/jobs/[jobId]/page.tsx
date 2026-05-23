import { notFound, redirect } from "next/navigation";
import { JobDetailContent } from "@/components/app/details/JobDetailContent";
import { getCanonicalJobById } from "@/lib/company/data";
import { createClient } from "@/lib/supabase/server";

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
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

  const { jobId } = await params;
  const job = await getCanonicalJobById(jobId);
  if (!job) notFound();

  return (
    <JobDetailContent
      job={job}
      backHref="/admin/jobs"
      companyHref={`/admin/companies/${job.company_id}`}
    />
  );
}
