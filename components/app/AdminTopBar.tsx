"use client";

import { usePathname } from "next/navigation";
import { DashboardTopBar } from "@/components/app/DashboardTopBar";

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/jobs": "Jobs",
  "/admin/blogs": "Blogs",
  "/admin/blogs/new": "New Blog",
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
  }

  return <DashboardTopBar title={title} role="admin" />;
}
