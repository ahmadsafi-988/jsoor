import { getNotifications } from "@/lib/notifications/actions";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const notifications = await getNotifications();
  return <NotificationsClient notifications={notifications} />;
}
