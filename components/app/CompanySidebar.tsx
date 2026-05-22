"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Briefcase, ClipboardCheck,
  Building2, LogOut, Bell, MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/company/home",          icon: LayoutDashboard },
  { label: "Jobs",          href: "/company/jobs",           icon: Briefcase },
  { label: "Assessments",   href: "/company/assessments",    icon: ClipboardCheck },
  { label: "Messages",      href: "/company/messages",       icon: MessageSquare },
  { label: "Profile",       href: "/company/profile",        icon: Building2 },
  { label: "Notifications", href: "/company/notifications",  icon: Bell },
];

function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarCompany = { name: string; logoUrl: string | null };

export function CompanySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [company, setCompany] = useState<SidebarCompany | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data }, { count: notifCount }] = await Promise.all([
        supabase.from("companies").select("name, logo_url").eq("id", user.id).single(),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
      ]);
      if (data) setCompany({ name: data.name, logoUrl: data.logo_url });
      setUnreadNotifs(notifCount ?? 0);

      // Unread messages: count unread msgs in conversations this company is part of
      const { data: convIds } = await supabase
        .from("conversations")
        .select("id")
        .eq("company_id", user.id);
      if (convIds?.length) {
        const { count: msgCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", convIds.map((c) => c.id))
          .neq("sender_id", user.id)
          .eq("is_read", false);
        setUnreadMsgs(msgCount ?? 0);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const visibleUnreadMsgs = pathname.startsWith("/company/messages") ? 0 : unreadMsgs;
  const visibleUnreadNotifs = pathname.startsWith("/company/notifications") ? 0 : unreadNotifs;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-neutral-950 z-50 flex flex-col p-6 shadow-[20px_0_40px_rgba(0,168,107,0.05)] hidden md:flex">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#00a86b] tracking-tight font-headline">JSOOR</h1>
        <p className="text-neutral-500 text-xs mt-0.5">Company Portal</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = isRouteActive(pathname, href);
          const badge =
            label === "Notifications" ? visibleUnreadNotifs :
            label === "Messages"      ? visibleUnreadMsgs   : 0;
          return (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white shadow-lg shadow-[#00a86b]/20"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
              }`}>
                <div className="relative shrink-0">
                  <Icon className="w-5 h-5" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>

        {company && (
          <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white overflow-hidden shrink-0 ring-2 ring-[#006d43]/30 flex items-center justify-center p-0.5">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain rounded-full" />
              ) : (
                <Building2 className="w-4 h-4 text-neutral-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{company.name}</p>
              <p className="text-neutral-500 text-xs">Company</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
