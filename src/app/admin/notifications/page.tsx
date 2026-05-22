import { getNotifications } from "@/lib/notifications/actions";
import AdminNotificationsClient from "./AdminNotificationsClient";

export default async function AdminNotificationsPage() {
  const notifications = await getNotifications();
  return <AdminNotificationsClient notifications={notifications} />;
}
