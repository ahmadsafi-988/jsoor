import { getAllSkills, getLocations, getSkillCategories } from "@/lib/company/data";
import { NewJobForm } from "./NewJobForm";

export default async function NewJobPage() {
  const [skills, categories, locations] = await Promise.all([
    getAllSkills(),
    getSkillCategories(),
    getLocations(),
  ]);

  return <NewJobForm allSkills={skills} categories={categories} locations={locations} />;
}
