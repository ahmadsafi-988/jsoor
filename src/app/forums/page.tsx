import { ForumsHomeClient } from "./ForumsHomeClient";
import { getForumsHomeData } from "@/lib/forums/data";

export default async function ForumsPage() {
  const { forums, requests, role, followingPosts, popularPosts } = await getForumsHomeData();

  return (
    <ForumsHomeClient
      forums={forums}
      requests={requests}
      role={role}
      followingPosts={followingPosts}
      popularPosts={popularPosts}
    />
  );
}
