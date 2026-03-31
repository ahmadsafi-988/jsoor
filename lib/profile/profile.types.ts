// lib/profile.types.ts
// ─────────────────────────────────────────────────────────────────────────────
// All types and mock data for the profile page live here.
// When you're ready to connect to a database, replace the mock data exports
// at the bottom with real API/DB calls. The page itself won't need to change.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  twitter: string;
  github: string;
  joinedDate: string;
  cvFile: string;
  stats: {
    followers: number;
    following: number;
  };
};

export type EducationEntry = {
  id: number;
  institution: string;
  degree: string;
  gpa: string;
  startDate: string;
  endDate: string;
  logo: string;
};

export type Project = {
  id: number;
  name: string;
  description: string;
  skills: string[];
  url: string;
  status: "Live" | "In Progress";
};

export type CredlyBadge = {
  id: number;
  name: string;
  issuer: string;
  image: string;
  url: string;
  date: string;
};

export type ProfileData = {
  user: User;
  education: EducationEntry[];
  skills: string[];
  projects: Project[];
  credlyBadges: CredlyBadge[];
  isOwnProfile: boolean; // true = show Edit Profile button
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Replace these with real API calls when ready. See steps in profile-page.tsx.

export const mockUser: User = {
  id: "user_1",
  name: "Sarah Chen",
  username: "@sarahchen",
  avatar: "https://github.com/shadcn.png",
  bio: "Full-stack engineer & open-source contributor. Building things that matter. Coffee enthusiast ☕",
  location: "San Francisco, CA",
  website: "sarahchen.dev",
  twitter: "sarahchendev",
  github: "sarahchen",
  joinedDate: "January 2022",
  cvFile: "/files/sarah-chen-cv.pdf",
  stats: { followers: 1284, following: 348 },
};

export const mockEducation: EducationEntry[] = [
  {
    id: 1,
    institution: "The University of Jordan",
    degree: "Bachelor of Science in Computer Science",
    gpa: "3.7 / 4.0",
    startDate: "Sep 2020",
    endDate: "Jun 2024",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/36/University_of_Jordan_Logo.svg",
  },
];

export const mockSkills: string[] = [
  "React", "Next.js", "TypeScript", "Node.js", "Postgres", "Tailwind",
];

export const mockProjects: Project[] = [
  {
    id: 1,
    name: "DevBoard",
    description:
      "A developer dashboard for tracking GitHub activity, open PRs, and deployment status across multiple repos.",
    skills: ["React", "Next.js", "TypeScript", "Postgres"],
    url: "https://github.com/sarahchen/devboard",
    status: "Live",
  },
  {
    id: 2,
    name: "QueryMate",
    description:
      "An AI-powered SQL assistant that lets non-technical users query databases using plain English.",
    skills: ["Next.js", "TypeScript", "Postgres", "Node.js"],
    url: "https://github.com/sarahchen/querymate",
    status: "In Progress",
  },
  {
    id: 3,
    name: "Palette UI",
    description:
      "An open-source component library built on top of Tailwind CSS with a focus on accessibility.",
    skills: ["React", "TypeScript", "Tailwind"],
    url: "https://github.com/sarahchen/palette-ui",
    status: "Live",
  },
];

export const mockCredlyBadges: CredlyBadge[] = [
  {
    id: 1,
    name: "AWS Certified Developer",
    issuer: "Amazon Web Services",
    image: "https://images.credly.com/size/80x80/images/b9feab85-1a43-4f6c-99a5-631b88d5461b/image.png",
    url: "https://www.credly.com/badges/example-1",
    date: "Dec 2025",
  },
  {
    id: 2,
    name: "GitHub Actions",
    issuer: "GitHub",
    image: "https://images.credly.com/size/80x80/images/89efc3e7-842b-4790-b09b-9ea5efc71ec3/image.png",
    url: "https://www.credly.com/badges/example-2",
    date: "Sep 2025",
  },
  {
    id: 3,
    name: "MongoDB Associate Developer",
    issuer: "MongoDB",
    image: "https://images.credly.com/size/80x80/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png",
    url: "https://www.credly.com/badges/example-3",
    date: "Jun 2025",
  },
];

// ─── Mock data fetch function ─────────────────────────────────────────────────
// This is the ONLY function the page calls to get its data.
// Replace the body of this function with a real DB/API call.
//
// STEP 1 — Install your DB client, e.g.:
//   npm install @prisma/client   (Prisma)
//   npm install drizzle-orm      (Drizzle)
//
// STEP 2 — Replace the return value below with something like:
//   const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
//   const education = await db.query.education.findMany({ where: eq(education.userId, userId) });
//   ... etc
//
// STEP 3 — Get the logged-in user's ID from your auth provider, e.g.:
//   import { auth } from "@/lib/auth";
//   const session = await auth();
//   const isOwnProfile = session?.user?.id === userId;
//
// STEP 4 — Handle not found:
//   if (!user) notFound(); // from "next/navigation"

export async function getProfileData(userId: string): Promise<ProfileData> {
  // ── Replace everything below with real DB calls ──
  void userId; // remove this line when you use userId

  return {
    user: mockUser,
    education: mockEducation,
    skills: mockSkills,
    projects: mockProjects,
    credlyBadges: mockCredlyBadges,
    isOwnProfile: false, // hardcoded for now — replace with auth check
  };
}