import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAllJobs } from "@/lib/admin/data";
import { AdminJobsClient } from "./AdminJobsClient";

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const jobs = await getAllJobs();

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Jobs</h1>
      <p className="text-neutral-500 text-sm mb-8">Lock or unlock job listings across all companies</p>
      <AdminJobsClient jobs={jobs} />
    </div>
  );
}
