"use client";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/company/home": "Dashboard",
  "/company/jobs": "Jobs",
  "/company/jobs/new": "Post a Job",
  "/company/assessments": "Assessments",
  "/company/profile": "Company Profile",
  "/company/onboarding": "Setup",
  "/company/messages": "Messages",
  "/company/notifications": "Notifications",
};

export function CompanyTopBar() {
  const pathname = usePathname();

  let title = PAGE_TITLES[pathname] ?? "JSOOR";
  if (pathname.startsWith("/company/jobs/") && pathname.includes("/applicants")) {
    title = "Applicants";
  } else if (pathname.startsWith("/company/applicants/")) {
    title = "Applicant Profile";
  } else if (pathname.startsWith("/company/jobs/") && !pathname.includes("/new")) {
    title = "Job Details";
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-neutral-100 flex items-center justify-between px-8 h-16 gap-4">
      <span className="font-headline text-xl font-bold tracking-tight text-neutral-900 hidden md:block shrink-0">
        {title}
      </span>
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-[#f6f3f2] rounded-full py-2.5 pl-10 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 border-none focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 transition-all"
        />
      </div>
      <div className="flex items-center gap-1">
        <Link href="/company/notifications">
          <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-[#006d43] transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </Link>
      </div>
    </header>
  );
}
