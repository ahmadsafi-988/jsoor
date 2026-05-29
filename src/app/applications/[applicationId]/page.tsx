import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ApplicationCanonicalRedirectPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
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

  if (profile?.role === "admin") redirect(`/admin/applications/${applicationId}`);
  if (profile?.role === "company") redirect(`/company/applicants/${applicationId}`);

  redirect(`/job-seeker/applications/${applicationId}`);
}
