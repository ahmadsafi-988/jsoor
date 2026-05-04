import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAllReports } from "@/lib/admin/data";
import { AdminReportsClient } from "./AdminReportsClient";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const reports = await getAllReports();

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Job Reports</h1>
      <p className="text-neutral-500 text-sm mb-8">Review reported job listings</p>
      <AdminReportsClient reports={reports} />
    </div>
  );
}
