import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CompanyCanonicalRedirectPage({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = await params;
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

  if (profile?.role === "admin") redirect(`/admin/companies/${identifier}`);
  if (profile?.role === "company") redirect(`/company/companies/${identifier}`);

  redirect(`/job-seeker/companies/${identifier}`);
}
