import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAllCompanies } from "@/lib/admin/data";
import { AdminCompaniesClient } from "./AdminCompaniesClient";

export default async function AdminCompaniesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const companies = await getAllCompanies();

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Companies</h1>
      <p className="text-neutral-500 text-sm mb-8">Verify or unverify company accounts</p>
      <AdminCompaniesClient companies={companies} />
    </div>
  );
}
