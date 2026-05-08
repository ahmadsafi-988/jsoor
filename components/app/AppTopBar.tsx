"use client";
import { Bell, MessageSquare } from "lucide-react";
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

  if (pathname === "/job-seeker/home") return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-neutral-100 flex items-center justify-between px-8 h-16 gap-4">
      {/* Page title */}
      <span className="font-headline text-xl font-bold tracking-tight text-neutral-900 hidden md:block shrink-0">
        {title}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Link href="/job-seeker/notifications">
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-[#006d43] transition-colors">
            <Bell className="w-5 h-5" />
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
