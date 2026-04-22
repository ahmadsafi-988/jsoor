import { getActiveJobsWithSkills, getMyApplications, getSavedJobIds } from "@/lib/company/data";
import { createClient } from "@/lib/supabase/server";
import { JobSeekerHomeClient } from "./JobSeekerHomeClient";

export default async function JobSeekerHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's skill IDs for match calculation
  let userSkillIds: number[] = [];
  if (user) {
    const { data } = await supabase
      .from("profile_to_skills")
      .select("skill_id")
      .eq("user_id", user.id);
    userSkillIds = (data ?? []).map((r) => r.skill_id).filter(Boolean) as number[];
  }

  const [jobs, myApplications, savedIds] = await Promise.all([
    getActiveJobsWithSkills(userSkillIds),
    getMyApplications(),
    getSavedJobIds(),
  ]);

  const appliedJobIds = myApplications.map((a) => a.job_id);

  return (
    <JobSeekerHomeClient
      initialJobs={jobs}
      initialAppliedIds={appliedJobIds}
      initialSavedIds={savedIds}
    />
  );
}
