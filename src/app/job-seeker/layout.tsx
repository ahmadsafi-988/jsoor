import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopBar } from "@/components/app/AppTopBar";

export default function JobSeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#fcf9f8]">
      <AppSidebar />
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        <AppTopBar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
