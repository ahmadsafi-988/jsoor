import { getJobSeekerConversations } from "@/lib/messages/actions";
import MessagesClient from "./MessagesClient";

export default async function JobSeekerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>;
}) {
  const { conv } = await searchParams;
  const conversations = await getJobSeekerConversations();
  return <MessagesClient conversations={conversations} initialConvId={conv} />;
}
