import {
  LayoutDashboard,
  BarChart2,
  Users,
  FileText,
  Settings,
  CreditCard,
  Bell,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number; // optional notification count
}

export interface NavGroup {
  title?: string; // undefined = no section heading
  items: NavItem[];
}

// ─── EDIT THIS TO CUSTOMISE YOUR SIDEBAR ────────────────────────────────────
export const navGroups: NavGroup[] = [
  {
    items: [
      { label: "Dashboard",  href: "/dashboard",          icon: LayoutDashboard },
      { label: "Analytics",  href: "/dashboard/analytics", icon: BarChart2 },
    ],
  },
  {
    title: "Manage",
    items: [
      { label: "Users",     href: "/dashboard/users",    icon: Users },
      { label: "Reports",   href: "/dashboard/reports",  icon: FileText },
      { label: "Billing",   href: "/dashboard/billing",  icon: CreditCard },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell,     badge: 4 },
      { label: "Settings",      href: "/dashboard/settings",      icon: Settings },
      { label: "Help",          href: "/dashboard/help",          icon: HelpCircle },
    ],
  },
];
// ─────────────────────────────────────────────────────────────────────────────