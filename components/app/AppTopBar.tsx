"use client";
import { Bell, MessageSquare, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/job-seeker/home": "Dashboard",
  "/job-seeker/profile": "Profile",
  "/job-seeker/job-applications": "My Applications",
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
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-neutral-100 flex items-center justify-between px-8 h-16 gap-4">
      {/* Page title */}
      <span className="font-headline text-xl font-bold tracking-tight text-neutral-900 hidden md:block shrink-0">
        {title}
      </span>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-[#f6f3f2] rounded-full py-2.5 pl-10 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 border-none focus:outline-none focus:ring-2 focus:ring-[#006d43]/20 transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Link href="/job-seeker/notifications">
          <button className="relative w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-[#006d43] transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#006d43] rounded-full border-2 border-white" />
          </button>
        </Link>
        <Link href="/job-seeker/messages">
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-[#006d43] transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>
        </Link>
      </div>
    </header>
  );
}
