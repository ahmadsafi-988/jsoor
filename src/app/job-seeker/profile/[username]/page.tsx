// app/job-seeker/profile/[username]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Server Component — fetches profile data from Supabase by username,
// determines ownership via the current auth session, then renders the page.
// ─────────────────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

import { ProfileHero } from "@/components/profile/profile-hero";
import { getProfileByUsername, getCurrentUserId } from "@/lib/profile/profile_data";
import type { project, badge } from "@/lib/global_types";

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="font-semibold text-foreground">{title}</h2>
    </div>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────
function SkillsSection({ skills }: { skills: string[] }) {
  return (
    <div className="space-y-2">
      <SectionHeader icon={Wrench} title="Skills" />
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge key={skill} variant="secondary">
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// ─── Education ────────────────────────────────────────────────────────────────
// Built from the profile_base fields (single institution per profile for now).
function EducationSection({
  institution,
  degree,
  gpa,
  eduStart,
  eduEnd,
  logoUrl,
}: {
  institution: string;
  degree: string;
  gpa: string | null;
  eduStart: string | null;
  eduEnd: string | null;
  logoUrl: string | null;
}) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={GraduationCap} title="Education" />
      <div className="flex gap-4 rounded-lg border bg-card px-4 py-3.5">
        {logoUrl && (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            <img
              src={logoUrl}
              alt={institution}
              className="h-16 w-16 object-contain p-1.5"
            />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-semibold leading-snug">{institution}</p>
          <p className="text-sm text-muted-foreground">{degree}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 pt-0.5 text-xs text-muted-foreground">
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
                <p className="font-semibold">{project.name}</p>
                <Badge
                  variant={project.status === "Live" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {project.status}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {project.description}
              </p>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <GitBranch className="h-3.5 w-3.5" />
                View on GitHub
              </a>
            </div>
            {i < projects.length - 1 && <Separator />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── CV Download ──────────────────────────────────────────────────────────────
function CVDownloadCard({ cvUrl }: { cvUrl: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Curriculum Vitae
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Download the latest CV for a full overview of experience, education,
          and projects.
        </p>
        <Button asChild size="sm" className="w-full">
          <a href={cvUrl} download>
            <Download className="mr-2 h-4 w-4" />
            Download CV
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function BadgesCard({ badges }: { badges: badge[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Award className="h-4 w-4 text-muted-foreground" />
          Certifications &amp; Badges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {badges.map((b) => (
          <a
            key={b.id}
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md p-1.5 transition-colors hover:bg-muted"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
              <img
                src={b.image}
                alt={b.name}
                className="h-10 w-10 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{b.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {b.issuer} · {b.date}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Fetch in parallel: profile data + current user id
  const [profileData, currentUserId] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUserId(),
  ]);

  // 404 if username doesn't exist
  if (!profileData) notFound();

  const { profile_base, projects, badges, skills } = profileData

  // The Edit Profile button is shown only when the viewer owns this profile
  const isOwnProfile = currentUserId === profile_base.id;

  return (
    <main>
      <ProfileHero user={profile_base} isOwnProfile={isOwnProfile} />

      <div className="mx-auto max-w-5xl px-4 pb-16">
        <Separator className="my-5" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left column */}
          <div className="flex-1 space-y-6">
            <SkillsSection skills={skills} />
            {/* Education — rendered only when institution data is present */}
            {profile_base.institution && profile_base.degree && (
              <EducationSection
                institution={profile_base.institution}
                degree={profile_base.degree}
                gpa={profile_base.gpa}
                eduStart={profile_base.edu_start}
                eduEnd={profile_base.edu_end}
                logoUrl={profile_base.logo_url}
              />
            )}

            {projects.length > 0 && <ProjectsSection projects={projects} />}
          </div>

          {/* Right column */}
          <div className="w-full space-y-4 lg:w-64 lg:shrink-0">
            {profile_base.cv_url && (
              <CVDownloadCard cvUrl={profile_base.cv_url} />
            )}
            {badges.length > 0 && <BadgesCard badges={badges} />}
          </div>
        </div>
      </div>
    </main>
  );
}