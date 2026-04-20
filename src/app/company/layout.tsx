import { CompanySidebar } from "@/components/app/CompanySidebar";
import { CompanyTopBar } from "@/components/app/CompanyTopBar";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#fcf9f8]">
      <CompanySidebar />
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        <CompanyTopBar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
