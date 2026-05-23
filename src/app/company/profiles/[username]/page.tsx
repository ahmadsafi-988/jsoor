import { notFound } from "next/navigation";
import { JobSeekerProfileDetail } from "@/components/app/details/JobSeekerProfileDetail";
import { MessageActionButton } from "@/components/app/MessageActionButton";
import { getProfileByUsername } from "@/lib/profile/profile_data";

export default async function CompanyJobSeekerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ applicationId?: string }>;
}) {
  const { username } = await params;
  const { applicationId } = await searchParams;
  const profileData = await getProfileByUsername(username);
  if (!profileData || profileData.profile_base.role !== "job_seeker") notFound();

  return (
    <JobSeekerProfileDetail
      profileData={profileData}
      backHref="/company/messages"
      messageAction={
        <MessageActionButton
          mode="company-job-seeker"
          jobSeekerId={profileData.profile_base.id}
          applicationId={applicationId}
          label="Message"
        />
      }
    />
  );
}
