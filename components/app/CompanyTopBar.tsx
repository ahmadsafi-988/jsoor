"use client";

import { Bell, MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { DashboardTopBar } from "@/components/app/DashboardTopBar";

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
        { href: "/company/notifications", label: "Notifications", icon: Bell },
        { href: "/company/messages", label: "Messages", icon: MessageSquare },
      ]}
    />
  );
}
