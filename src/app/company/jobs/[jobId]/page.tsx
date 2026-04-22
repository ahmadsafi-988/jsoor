import { notFound } from "next/navigation";
import { getJobById, getAllSkills, getJobSkillIds } from "@/lib/company/data";
import { EditJobForm } from "./EditJobForm";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const [job, allSkills, selectedSkillIds] = await Promise.all([
    getJobById(jobId),
    getAllSkills(),
    getJobSkillIds(jobId),
  ]);

  if (!job) notFound();

  return (
    <EditJobForm job={job} allSkills={allSkills} initialSkillIds={selectedSkillIds} />
  );
}
