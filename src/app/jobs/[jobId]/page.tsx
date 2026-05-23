import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCanonicalJobById } from "@/lib/company/data";

export default async function JobCanonicalRedirectPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: profile }, job] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    getCanonicalJobById(jobId),
  ]);

  if (profile?.role === "admin") redirect(`/admin/jobs/${jobId}`);
  if (profile?.role === "company") {
    if (job?.company_id === user.id) redirect(`/company/jobs/${jobId}`);
    redirect(`/company/opportunities/${jobId}`);
  }

  redirect(`/job-seeker/jobs/${jobId}`);
}
