"use client";
import { Bell, MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { DashboardTopBar } from "@/components/app/DashboardTopBar";

const PAGE_TITLES: Record<string, string> = {
  "/job-seeker/home": "Dashboard",
  "/job-seeker/profile": "Profile",
  "/job-seeker/job-applications": "My Applications",
  "/job-seeker/saved-jobs": "Saved Jobs",
  "/job-seeker/interview-simulator": "Interview Simulator",
  "/job-seeker/messages": "Messages",
  "/job-seeker/notifications": "Notifications",
  "/job-seeker/onboarding": "Onboarding",
  "/job-seeker/assessments": "My Assessments",
};

export function AppTopBar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "JSOOR";

  return (
    <DashboardTopBar
      title={title}
      role="job-seeker"
      actions={[
        { href: "/job-seeker/notifications", label: "Notifications", icon: Bell },
        { href: "/job-seeker/messages", label: "Messages", icon: MessageSquare },
      ]}
    />
  );
}
