import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopBar } from "@/components/app/AppTopBar";
import {
  DashboardContent,
  DashboardSidebarProvider,
} from "@/components/app/DashboardSidebarState";

export default function JobSeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardSidebarProvider className="bg-[#fcf9f8]">
      <AppSidebar />
      <DashboardContent>
        <AppTopBar />
        <main className="flex-1 min-w-0">{children}</main>
      </DashboardContent>
    </DashboardSidebarProvider>
  );
}
