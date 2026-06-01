import { UnreadMessagesClearedMarker } from "@/components/app/UnreadMessagesClearedMarker";
import {
  getCompanyConversations,
  markAllMessagesRead,
} from "@/lib/messages/actions";
import CompanyMessagesClient from "./CompanyMessagesClient";

export default async function CompanyMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>;
}) {
  const { conv } = await searchParams;
  await markAllMessagesRead();
  const conversations = await getCompanyConversations();
  return (
    <>
      <UnreadMessagesClearedMarker />
      <CompanyMessagesClient conversations={conversations} initialConvId={conv} />
    </>
  );
}
