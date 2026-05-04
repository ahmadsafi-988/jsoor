import { getCompanyConversations } from "@/lib/messages/actions";
import CompanyMessagesClient from "./CompanyMessagesClient";

export default async function CompanyMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>;
}) {
  const { conv } = await searchParams;
  const conversations = await getCompanyConversations();
  return <CompanyMessagesClient conversations={conversations} initialConvId={conv} />;
}
