import { redirect } from "next/navigation";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  await params;
  redirect("/company/assessments/templates");
}
