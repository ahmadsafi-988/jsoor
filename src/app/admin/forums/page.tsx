import { redirect } from "next/navigation";
import { AdminForumsClient } from "./AdminForumsClient";
import { getAdminForumsDashboard } from "@/lib/forums/data";
import { createClient } from "@/lib/supabase/server";

export default async function AdminForumsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/");

  const data = await getAdminForumsDashboard();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-neutral-900">Communities</h1>
      <p className="mb-8 text-sm text-neutral-500">
        Review community requests, manage communities, and moderate reported community content.
      </p>
      <AdminForumsClient data={data} />
    </div>
  );
}
