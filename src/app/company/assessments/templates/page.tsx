import { getCompanyTemplates } from "@/lib/company/templates";
import { TemplatesClient } from "./TemplatesClient";
import { LayoutTemplate, Plus } from "lucide-react";
import Link from "next/link";

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
        <Link
          href="/company/assessments/templates/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white text-sm font-semibold rounded-xl hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" /> New Template
        </Link>
      </div>

      <TemplatesClient templates={templates} />
    </div>
  );
}
