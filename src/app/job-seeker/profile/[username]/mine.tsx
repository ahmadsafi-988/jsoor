// app/job-seeker/profile/[username]/page.tsx
import { notFound } from "next/navigation";
import React from "react";
import {
  FileText,
  Download,
  GitBranch,
  Award,
  ExternalLink,
  GraduationCap,
  FolderGit2,
  Wrench,
  BookOpen,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { ProfileHero } from "@/components/profile/profile-hero";
import { getProfileByUsername, getCurrentUserId } from "@/lib/profile/profile_data";
import type { project, badge } from "@/lib/global_types";
import type { Tables } from "@/lib/supabase_generated_types";

type Profile = Tables<"profiles">;
type JobSeekerProfile = Tables<"job_seeker_profiles">;

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <Icon className="h-4 w-4 text-[#006d43]" />
      <h2 className="font-semibold text-[#1c1b1b]">{title}</h2>
    </div>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────
function SkillsSection({ skills }: { skills: string[] }) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={Wrench} title="Skills" />
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="bg-[#ebe7e7] text-[#1c1b1b] px-4 py-1.5 rounded-full text-sm font-medium border border-[#bccabe]/20 hover:border-[#006d43]/50 transition-colors cursor-default"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Education ────────────────────────────────────────────────────────────────
function EducationSection({
  institution,
  degree,
  gpa,
  eduStart,
  eduEnd,
}: {
  institution: string;
  degree: string;
  gpa: string | null;
  eduStart: string | null;
  eduEnd: string | null;
}) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={GraduationCap} title="Education" />
      <div className="flex gap-4 rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-4 py-3.5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-semibold text-[#1c1b1b] leading-snug">{institution}</p>
          <p className="text-sm text-[#3d4a41]">{degree}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 pt-0.5 text-xs text-[#5f5e5e]">
            {gpa && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                GPA: {gpa}
              </span>
            )}
            {(eduStart || eduEnd) && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {eduStart ?? "?"} — {eduEnd ?? "Present"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Projects ─────────────────────────────────────────────────────────────────
function ProjectsSection({ projects }: { projects: project[] }) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={FolderGit2} title="Projects" />
      <div className="space-y-3">
        {projects.map((project, i) => (
          <React.Fragment key={project.id}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[#1c1b1b]">{project.name}</p>
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    project.status === "Live"
                      ? "bg-[#78fbb6]/30 text-[#005232]"
                      : "bg-[#e5e2e1] text-[#5f5e5e]"
                  }`}
                >
                  {project.status}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#3d4a41]">
                {project.description}
              </p>
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#006d43] hover:text-[#00a86b] transition-colors"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  View on GitHub
                </a>
              )}
            </div>
            {i < projects.length - 1 && <Separator className="bg-[#e5e2e1]" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── CV Download ──────────────────────────────────────────────────────────────
function CVDownloadCard({ cvUrl }: { cvUrl: string }) {
  return (
    <div className="bg-[#f6f3f2] rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-[#006d43]" />
        <h3 className="text-sm font-semibold text-[#1c1b1b]">Curriculum Vitae</h3>
      </div>
      <p className="text-xs text-[#5f5e5e]">
        Download the latest CV for a full overview of experience, education, and projects.
      </p>
      <a
        href={cvUrl}
        download
        className="flex items-center justify-center gap-2 w-full bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 hover:shadow-[0_8px_16px_rgba(0,109,67,0.2)] transition-all"
      >
        <Download className="h-4 w-4" />
        Download CV
      </a>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function BadgesCard({ badges }: { badges: badge[] }) {
  return (
    <div className="bg-[#f6f3f2] rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-[#006d43]" />
        <h3 className="text-sm font-semibold text-[#1c1b1b]">Certifications &amp; Badges</h3>
      </div>
      <div className="space-y-1">
        {badges.map((b) => (
          <a
            key={b.id}
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-[#e5e2e1]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e5e2e1] bg-white">
              <img src={b.image} alt={b.name} className="h-10 w-10 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-[#1c1b1b]">{b.name}</p>
              <p className="truncate text-xs text-[#5f5e5e]">
                {b.issuer} · {b.date}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#5f5e5e]" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [profileData, currentUserId] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUserId(),
  ]);

  if (!profileData) notFound();

  const { profile_base, job_seeker_profile, projects, badges, skills } = profileData;
  const isOwnProfile = currentUserId === profile_base.id;

  // Merge base profile + job seeker profile for components that need both
  const flatUser = { ...profile_base, ...job_seeker_profile };

  return (
    <main className="bg-white min-h-screen">
      <ProfileHero user={flatUser} isOwnProfile={isOwnProfile} />

      <div className="mx-auto max-w-5xl px-4 pb-16">
        <Separator className="my-5 bg-[#e5e2e1]" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left column */}
          <div className="flex-1 space-y-6">
            <SkillsSection skills={skills} />
            {job_seeker_profile.institution && job_seeker_profile.degree && (
              <EducationSection
                institution={job_seeker_profile.institution}
                degree={job_seeker_profile.degree}
                gpa={job_seeker_profile.gpa}
                eduStart={job_seeker_profile.edu_start}
                eduEnd={job_seeker_profile.edu_end}
              />
            )}
            {projects.length > 0 && <ProjectsSection projects={projects} />}
          </div>

          {/* Right column */}
          <div className="w-full space-y-4 lg:w-64 lg:shrink-0">
            {job_seeker_profile.cv_url && <CVDownloadCard cvUrl={job_seeker_profile.cv_url} />}
            {badges.length > 0 && <BadgesCard badges={badges} />}
          </div>
        </div>
      </div>
    </main>
  );
}