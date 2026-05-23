import { AdminSidebar } from "@/components/app/AdminSidebar";
import { AdminTopBar } from "@/components/app/AdminTopBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f6f3f2]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        <AdminTopBar />
        <main className="flex-1 min-w-0 p-8">{children}</main>
      </div>
    </div>
  );
}
