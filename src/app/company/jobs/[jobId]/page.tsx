import { notFound } from "next/navigation";
import { getJobById, getAllSkills, getJobSkillIds, getLocations, getSkillCategories } from "@/lib/company/data";
import { EditJobForm } from "./EditJobForm";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const [job, allSkills, selectedSkillIds, categories, locations] = await Promise.all([
    getJobById(jobId),
    getAllSkills(),
    getJobSkillIds(jobId),
    getSkillCategories(),
    getLocations(),
  ]);

  if (!job) notFound();

  return (
    <EditJobForm
      job={job}
      allSkills={allSkills}
      initialSkillIds={selectedSkillIds}
      categories={categories}
      locations={locations}
    />
  );
}
