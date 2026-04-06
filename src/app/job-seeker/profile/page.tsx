// app/job-seeker/profile/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUsername } from "@/lib/profile/profile_data"

export default async function ProfileRedirectPage() {
  const username = await getCurrentUsername();

  if (!username) {
    redirect("/auth/login");
  }
  
  redirect(`/job-seeker/profile/${username}`);
}