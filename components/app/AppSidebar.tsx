"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, User, FileText, Brain, MessageSquare,
  Bell, Settings, LogOut, ClipboardCheck, Bookmark,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "Home",                href: "/job-seeker/home",                icon: Home },
  { label: "Profile",             href: "/job-seeker/profile",             icon: User },
  { label: "My Applications",     href: "/job-seeker/job-applications",    icon: FileText },
  { label: "Saved Jobs",          href: "/job-seeker/saved-jobs",          icon: Bookmark },
  { label: "Assessments",         href: "/job-seeker/assessments",         icon: ClipboardCheck },
  { label: "Interview Simulator", href: "/job-seeker/interview-simulator", icon: Brain },
  { label: "Messages",            href: "/job-seeker/messages",            icon: MessageSquare },
  { label: "Notifications",       href: "/job-seeker/notifications",       icon: Bell },
];

type SidebarUser = {
  name: string;
  role: string;
  avatarUrl: string | null;
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SidebarUser | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const [{ data }, { data: jsProfile }] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, avatar_url").eq("id", authUser.id).single(),
        supabase.from("job_seeker_profiles").select("degree").eq("id", authUser.id).single(),
      ]);
      if (data) {
        setUser({
          name: `${data.first_name} ${data.last_name}`.trim(),
          role: jsProfile?.degree || "Job Seeker",
          avatarUrl: data.avatar_url,
        });
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-950 z-50 flex flex-col p-6 shadow-[20px_0_40px_rgba(0,168,107,0.05)] hidden md:flex">
      {/* Brand */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#00a86b] tracking-tight font-headline">
          JSOOR
        </h1>
        <p className="text-neutral-500 text-xs mt-0.5">Career Curator</p>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/job-seeker/profile" && pathname.startsWith(href + "/"));
          return (
            <Link key={href} href={href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white shadow-lg shadow-[#00a86b]/20"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings + Logout */}
      <div className="mt-auto flex flex-col gap-1">
        <Link href="/job-seeker/settings">
          <div className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors cursor-pointer">
            <Settings className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>

        {/* User snippet */}
        {user && (
          <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-800 overflow-hidden shrink-0 ring-2 ring-[#006d43]/30 flex items-center justify-center">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-neutral-400 text-xs font-bold">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.name}</p>
              <p className="text-neutral-500 text-xs truncate">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
