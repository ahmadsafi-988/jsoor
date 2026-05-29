import { ForumsHomeClient } from "./ForumsHomeClient";
import { getForumsHomeData } from "@/lib/forums/data";

export default async function ForumsPage() {
  const { forums, requests, role } = await getForumsHomeData();

  return <ForumsHomeClient forums={forums} requests={requests} role={role} />;
}
