import { Sidebar } from "@/components/sidebar";
import { jobSeekerNavGroups } from "@/components/nav-items";

export default function JobSeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <Sidebar
        title="Job Seeker"
        navGroups={jobSeekerNavGroups}
        rootHref="/job-seeker"
      />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
