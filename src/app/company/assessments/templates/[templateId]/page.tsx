import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/company/templates";
import { TemplateFormClient } from "../TemplateFormClient";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const template = await getTemplate(templateId);
  if (!template) notFound();

  return <TemplateFormClient template={template} />;
}
