import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquareWarning } from "lucide-react";
import { getAllReports } from "@/lib/admin/data";
import { getPendingForumReportCount } from "@/lib/forums/data";
import { AdminReportsClient } from "./AdminReportsClient";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const [reports, pendingForumReports] = await Promise.all([
    getAllReports(),
    getPendingForumReportCount(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Reports</h1>
      <p className="text-neutral-500 text-sm mb-8">Review reported job listings and community content.</p>
      <Link
        href="/admin/forums#reported-content"
        className="mb-8 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-colors hover:border-[#006d43]/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#78fbb6]/20 text-[#006d43]">
            <MessageSquareWarning className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-neutral-900">Community Reports</h2>
            <p className="text-sm text-neutral-500">Moderate reported community posts and comments.</p>
          </div>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          {pendingForumReports} pending
        </span>
      </Link>
      <AdminReportsClient reports={reports} />
    </div>
  );
}
