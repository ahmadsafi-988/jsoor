import { getCompanyTemplates } from "@/lib/company/templates";
import { TemplatesClient } from "./TemplatesClient";

export default async function TemplatesPage() {
  const templates = await getCompanyTemplates();

  return (
    <div className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-headline text-[1.75rem] font-medium tracking-tight text-[#1c1b1b]">
            Assessment Templates
          </h2>
          <p className="text-[#3d4a41] text-sm mt-1">
            Reusable blueprints you can load when sending an assessment to an applicant.
          </p>
        </div>
      </div>

      <TemplatesClient templates={templates} />
    </div>
  );
}
