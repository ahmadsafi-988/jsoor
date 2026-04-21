import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-black text-[#00a86b]">JSOOR Admin</h1>
        <p className="text-neutral-400">Admin panel coming soon.</p>
      </div>
    </div>
  );
}
