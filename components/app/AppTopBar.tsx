"use client";
import { Bell, MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { DashboardTopBar } from "@/components/app/DashboardTopBar";
import { useUnreadIndicators } from "@/components/app/useUnreadIndicators";

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
  const { hasUnreadMessages, hasUnreadNotifications } =
    useUnreadIndicators("job-seeker");
  let title = PAGE_TITLES[pathname] ?? "JSOOR";
  if (pathname.startsWith("/job-seeker/companies/")) {
    title = "Company Profile";
  } else if (pathname.startsWith("/job-seeker/jobs/")) {
    title = "Job Details";
  } else if (pathname.startsWith("/job-seeker/applications/")) {
    title = "Application Details";
  }

  return (
    <DashboardTopBar
      title={title}
      role="job-seeker"
      actions={[
        {
          href: "/job-seeker/notifications",
          label: "Notifications",
          icon: Bell,
          hasUnread: hasUnreadNotifications,
        },
        {
          href: "/job-seeker/messages",
          label: "Messages",
          icon: MessageSquare,
          hasUnread: hasUnreadMessages,
        },
      ]}
    />
  );
}
