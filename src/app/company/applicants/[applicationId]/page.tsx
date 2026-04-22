import { notFound, redirect } from "next/navigation";
import { getApplicationWithApplicantProfile } from "@/lib/company/data";
import { getAssessmentForApplication } from "@/lib/company/data";
import { getCvSignedUrl } from "@/lib/storage/cv";
import { ApplicantDetailClient } from "./ApplicantDetailClient";

export default async function ApplicantDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;

  const result = await getApplicationWithApplicantProfile(applicationId);
  if (!result) notFound();
  if (!result.company_owns_application) redirect("/company/home");

  const cvUrl = result.applicant.job_seeker_profile?.cv_url;
  const cvSignedUrl = cvUrl ? await getCvSignedUrl(cvUrl) : null;

  const assessment = await getAssessmentForApplication(applicationId);

  return (
    <ApplicantDetailClient
      result={result}
      cvSignedUrl={cvSignedUrl}
      initialAssessment={assessment}
    />
  );
}
