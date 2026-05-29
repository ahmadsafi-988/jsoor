import { getMyApplications } from "@/lib/company/data";
import { JobApplicationsClient } from "./JobApplicationsClient";

export default async function JobApplicationsPage() {
  const applications = await getMyApplications();

  return (
    <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">
          My Applications
        </h2>
        <p className="text-[#3d4a41] text-sm">Track and manage your career opportunities.</p>
      </div>

      <JobApplicationsClient initialApplications={applications} />
    </div>
  );
}
