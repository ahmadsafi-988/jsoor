import { getMyAssessments } from "@/lib/company/data";
import { AssessmentsClient } from "./AssessmentsClient";

export default async function JobSeekerAssessmentsPage() {
  const assessments = await getMyAssessments();

  return (
    <div className="p-8 max-w-4xl mx-auto w-full flex flex-col gap-8">
      <div>
        <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">
          My Assessments
        </h2>
        <p className="text-[#3d4a41] text-sm mt-1">Assessments sent to you by companies.</p>
      </div>

      <AssessmentsClient initialAssessments={assessments} />
    </div>
  );
}
