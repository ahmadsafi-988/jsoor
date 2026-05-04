import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAdminStats } from "@/lib/admin/data";
import { Users, Building2, Briefcase, ClipboardList } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const stats = await getAdminStats();

  const cards = [
    { label: "Total Users",       value: stats.users,        icon: Users,         color: "from-blue-500 to-blue-600" },
    { label: "Total Companies",    value: stats.companies,    icon: Building2,     color: "from-purple-500 to-purple-600" },
    { label: "Total Jobs",         value: stats.jobs,         icon: Briefcase,     color: "from-[#006d43] to-[#00a86b]" },
    { label: "Total Applications", value: stats.applications, icon: ClipboardList, color: "from-orange-500 to-orange-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Dashboard</h1>
      <p className="text-neutral-500 text-sm mb-8">Platform overview</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-neutral-200 p-6 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900">{value.toLocaleString()}</p>
              <p className="text-sm text-neutral-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { href: "/admin/jobs",      label: "Manage Jobs",      desc: "Lock or unlock job listings" },
          { href: "/admin/companies", label: "Manage Companies", desc: "Verify or unverify companies" },
          { href: "/admin/users",     label: "Manage Users",     desc: "Block or suspend accounts" },
          { href: "/admin/reports",   label: "Job Reports",      desc: "Review reported job listings" },
          { href: "/admin/audit-log", label: "Audit Log",        desc: "Full history of admin actions" },
        ].map(({ href, label, desc }) => (
          <a key={href} href={href} className="bg-white rounded-2xl border border-neutral-200 p-5 hover:border-[#00a86b]/40 hover:shadow-md transition-all group">
            <p className="font-semibold text-neutral-900 group-hover:text-[#006d43] transition-colors">{label}</p>
            <p className="text-sm text-neutral-500 mt-1">{desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
