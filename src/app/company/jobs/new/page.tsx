import { getAllSkills } from "@/lib/company/data";
import { NewJobForm } from "./NewJobForm";

export default async function NewJobPage() {
  const skills = await getAllSkills();
  return <NewJobForm allSkills={skills} />;
}
