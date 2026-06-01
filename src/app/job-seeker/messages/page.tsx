import { UnreadMessagesClearedMarker } from "@/components/app/UnreadMessagesClearedMarker";
import {
  getJobSeekerConversations,
  markAllMessagesRead,
} from "@/lib/messages/actions";
import MessagesClient from "./MessagesClient";

export default async function JobSeekerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>;
}) {
  const { conv } = await searchParams;
  await markAllMessagesRead();
  const conversations = await getJobSeekerConversations();
  return (
    <>
      <UnreadMessagesClearedMarker />
      <MessagesClient conversations={conversations} initialConvId={conv} />
    </>
  );
}
