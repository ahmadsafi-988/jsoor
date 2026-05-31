import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/app/AdminSidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { CompanySidebar } from "@/components/app/CompanySidebar";
import { DashboardTopBar } from "@/components/app/DashboardTopBar";
import {
  DashboardContent,
  DashboardSidebarProvider,
} from "@/components/app/DashboardSidebarState";
import { createClient } from "@/lib/supabase/server";

export default async function ForumsLayout({ children }: { children: React.ReactNode }) {
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

  if (profile?.role !== "job_seeker" && profile?.role !== "company" && profile?.role !== "admin") redirect("/");

  const isAdmin = profile.role === "admin";
  const isCompany = profile.role === "company";

  return (
    <DashboardSidebarProvider className={isAdmin ? "bg-[#f6f3f2]" : "bg-[#fcf9f8]"}>
      {isAdmin ? <AdminSidebar /> : isCompany ? <CompanySidebar /> : <AppSidebar />}
      <DashboardContent>
        <DashboardTopBar title="Communities" role={isAdmin ? "admin" : isCompany ? "company" : "job-seeker"} />
        <main className="flex-1 min-w-0">{children}</main>
      </DashboardContent>
    </DashboardSidebarProvider>
  );
}
