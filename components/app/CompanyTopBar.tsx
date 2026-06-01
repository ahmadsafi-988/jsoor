"use client";

import { Bell, MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { DashboardTopBar } from "@/components/app/DashboardTopBar";
import { useUnreadIndicators } from "@/components/app/useUnreadIndicators";

const PAGE_TITLES: Record<string, string> = {
  "/company/home": "Dashboard",
  "/company/jobs": "Jobs",
  "/company/jobs/new": "Post a Job",
  "/company/assessments": "Assessments",
  "/company/messages": "Messages",
  "/company/notifications": "Notifications",
  "/company/profile": "Company Profile",
  "/company/onboarding": "Setup",
};

export function CompanyTopBar() {
  const pathname = usePathname();
  const { hasUnreadMessages, hasUnreadNotifications } =
    useUnreadIndicators("company");

  let title = PAGE_TITLES[pathname] ?? "JSOOR";
  if (pathname.startsWith("/company/jobs/") && pathname.includes("/applicants")) {
    title = "Applicants";
  } else if (pathname.startsWith("/company/applicants/")) {
    title = "Applicant Profile";
  } else if (pathname.startsWith("/company/profiles/")) {
    title = "Job Seeker Profile";
  } else if (pathname.startsWith("/company/companies/")) {
    title = "Company Profile";
  } else if (pathname.startsWith("/company/opportunities/")) {
    title = "Job Details";
  } else if (pathname.startsWith("/company/jobs/") && !pathname.includes("/new")) {
    title = "Job Details";
  }

  return (
    <DashboardTopBar
      title={title}
      role="company"
      actions={[
        {
          href: "/company/notifications",
          label: "Notifications",
          icon: Bell,
          hasUnread: hasUnreadNotifications,
        },
        {
          href: "/company/messages",
          label: "Messages",
          icon: MessageSquare,
          hasUnread: hasUnreadMessages,
        },
      ]}
    />
  );
}
