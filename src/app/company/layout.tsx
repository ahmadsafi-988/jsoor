import { CompanySidebar } from "@/components/app/CompanySidebar";
import { CompanyTopBar } from "@/components/app/CompanyTopBar";
import {
  DashboardContent,
  DashboardSidebarProvider,
} from "@/components/app/DashboardSidebarState";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardSidebarProvider className="bg-[#fcf9f8]">
      <CompanySidebar />
      <DashboardContent>
        <CompanyTopBar />
        <main className="flex-1 min-w-0">{children}</main>
      </DashboardContent>
    </DashboardSidebarProvider>
  );
}
