import { AdminSidebar } from "@/components/app/AdminSidebar";
import { AdminTopBar } from "@/components/app/AdminTopBar";
import {
  DashboardContent,
  DashboardSidebarProvider,
} from "@/components/app/DashboardSidebarState";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSidebarProvider className="bg-[#f6f3f2]">
      <AdminSidebar />
      <DashboardContent>
        <AdminTopBar />
        <main className="flex-1 min-w-0 p-8">{children}</main>
      </DashboardContent>
    </DashboardSidebarProvider>
  );
}
