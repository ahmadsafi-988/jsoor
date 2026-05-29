import { getNotifications } from "@/lib/notifications/actions";
import CompanyNotificationsClient from "./CompanyNotificationsClient";

export default async function CompanyNotificationsPage() {
  const notifications = await getNotifications();
  return <CompanyNotificationsClient notifications={notifications} />;
}
