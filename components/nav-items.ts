// import { Briefcase, FileText, House, User } from "lucide-react";

// export type NavItem = {
//   label: string;
//   href: string;
//   icon: React.ComponentType<{ className?: string }>;
//   badge?: number;
// };

// export type NavGroup = {
//   title?: string;
//   items: NavItem[];
// };

// export const jobSeekerNavGroups: NavGroup[] = [
//   {
//     title: "Main",
//     items: [
//       {
//         label: "Home",
//         href: "/job-seeker/home",
//         icon: House,
//       },
//       {
//         label: "Profile",
//         href: "/job-seeker/profile",
//         icon: User,
//       },
//       {
//         label: "Job Applications",
//         href: "/job-seeker/job-applications",
//         icon: FileText,
//       },
//       {
//         label: "Interview Simulator",
//         href: "/job-seeker/interview-simulator",
//         icon: Briefcase,
//       },
//     ],
//   },
// ];

export type IconName = "house" | "user" | "fileText" | "briefcase";

export type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

export const jobSeekerNavGroups: NavGroup[] = [
  {
    title: "Main",
    items: [
      {
        label: "Home",
        href: "/job-seeker/home",
        icon: "house",
      },
      {
        label: "Profile",
        href: "/job-seeker/profile",
        icon: "user",
      },
      {
        label: "Job Applications",
        href: "/job-seeker/job-applications",
        icon: "fileText",
      },
      {
        label: "Interview Simulator",
        href: "/job-seeker/interview-simulator",
        icon: "briefcase",
      },
    ],
  },
];
