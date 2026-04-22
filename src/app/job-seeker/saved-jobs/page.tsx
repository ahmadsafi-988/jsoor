import { getSavedJobs, getMyApplications } from "@/lib/company/data";
import { SavedJobsClient } from "./SavedJobsClient";

export default async function SavedJobsPage() {
  const [savedJobs, myApplications] = await Promise.all([
    getSavedJobs(),
    getMyApplications(),
  ]);

  const appliedJobIds = new Set(myApplications.map((a) => a.job_id));

  return (
    <div className="p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
      <div>
        <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">
          Saved Jobs
        </h2>
        <p className="text-[#3d4a41] text-sm mt-1">
          {savedJobs.length} saved job{savedJobs.length !== 1 ? "s" : ""}
        </p>
      </div>

      <SavedJobsClient initialJobs={savedJobs} appliedJobIds={[...appliedJobIds]} />
    </div>
  );
}
