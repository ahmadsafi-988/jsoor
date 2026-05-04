import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/lib/admin/data";
import { AdminUsersClient } from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const users = await getAllUsers();

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Users</h1>
      <p className="text-neutral-500 text-sm mb-8">Block or suspend user accounts</p>
      <AdminUsersClient users={users} />
    </div>
  );
}
