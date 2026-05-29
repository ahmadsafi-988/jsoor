"use client";

import { usePathname } from "next/navigation";
import { DashboardTopBar } from "@/components/app/DashboardTopBar";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/jobs": "Jobs",
  "/admin/blogs": "Blogs",
  "/admin/blogs/new": "New Blog",
  "/admin/forums": "Forums",
  "/admin/companies": "Companies",
  "/admin/users": "Users",
  "/admin/reports": "Reports",
  "/admin/audit-log": "Audit Log",
};

export function AdminTopBar() {
  const pathname = usePathname();

  let title = PAGE_TITLES[pathname] ?? "Admin";
  if (pathname.startsWith("/admin/blogs/") && pathname !== "/admin/blogs/new") {
    title = "Edit Blog";
  } else if (pathname.startsWith("/admin/jobs/")) {
    title = "Job Details";
  } else if (pathname.startsWith("/admin/companies/")) {
    title = "Company Details";
  } else if (pathname.startsWith("/admin/users/")) {
    title = "User Details";
  } else if (pathname.startsWith("/admin/applications/")) {
    title = "Application Details";
  }

  return <DashboardTopBar title={title} role="admin" />;
}
