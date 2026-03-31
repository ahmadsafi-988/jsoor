// app/profile/[userId]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Server Component — fetches data and renders the page.
// Interactive parts (bio toggle, buttons) live in profile-hero.tsx.
// ─────────────────────────────────────────────────────────────────────────────
// shadcn: npx shadcn@latest add avatar badge button card separator

import React from "react";
import { Badge } from "@/components/ui/badge";
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
import {
  getProfileData,
  type EducationEntry,
  type Project,
  type CredlyBadge,
} from "@/lib/profile/profile.types";
import { Button } from "@/components/ui/button";

// ─── Shared section header ────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="font-semibold text-foreground">{title}</h2>
    </div>
  );
}

// ─── Section components ───────────────────────────────────────────────────────
function SkillsSection({ skills }: { skills: string[] }) {
  return (
    <div className="space-y-2">
      <SectionHeader icon={Wrench} title="Skills" />
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge key={skill} variant="secondary">{skill}</Badge>
        ))}
      </div>
    </div>
  );
}

function EducationSection({ education }: { education: EducationEntry[] }) {
  return (
    <div className="space-y-3">
      <SectionHeader icon={GraduationCap} title="Education" />
      {education.map((edu) => (
        <div key={edu.id} className="flex gap-4 rounded-lg border bg-card px-4 py-3.5">
          <div className="flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            <img
              src={edu.logo}
              alt={edu.institution}
              className="h-18 w-18 object-contain p-1.5"
              //onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="font-semibold leading-snug">{edu.institution}</p>
            <p className="text-sm text-muted-foreground">{edu.degree}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 pt-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                GPA: {edu.gpa}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {edu.startDate} — {edu.endDate}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsSection({ projects }: { projects: Project[] }) {
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
              <div className="flex flex-wrap gap-1.5">
                {project.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                ))}
              </div>
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

function CVDownloadCard({ cvFile }: { cvFile: string }) {
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
          Download my latest CV for a full overview of my experience, education, and projects.
        </p>
        <Button asChild size="sm" className="w-full">
          <a href={cvFile} download>
            <Download className="mr-2 h-4 w-4" />
            Download CV
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function CredlyBadgesCard({ badges }: { badges: CredlyBadge[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Award className="h-4 w-4 text-muted-foreground" />
          Certifications &amp; Badges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {badges.map((badge) => (
          <a
            key={badge.id}
            href={badge.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md p-1.5 transition-colors hover:bg-muted"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
              <img
                src={badge.image}
                alt={badge.name}
                className="h-10 w-10 object-contain"
                //onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{badge.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {badge.issuer} · {badge.date}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </a>
        ))}
        <a
          href="https://www.credly.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block pt-1 text-center text-xs text-muted-foreground hover:text-foreground"
        >
          View all on Credly →
        </a>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  // Single call — swap getProfileData() internals to connect to your DB
  const { user, education, skills, projects, credlyBadges, isOwnProfile } =
    await getProfileData(params.userId);

  return (
    <main>
      <ProfileHero user={user} isOwnProfile={isOwnProfile} />

      <div className="mx-auto max-w-5xl px-4 pb-16">
        <Separator className="my-5" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left column */}
          <div className="flex-1 space-y-6">
            <SkillsSection skills={skills} />
            <EducationSection education={education} />
            <ProjectsSection projects={projects} />
            {/*
              When posts are ready:
              <PostsSection posts={posts} />
            */}
          </div>

          {/* Right column */}
          <div className="w-full space-y-4 lg:w-64 lg:shrink-0">
            <CVDownloadCard cvFile={user.cvFile} />
            <CredlyBadgesCard badges={credlyBadges} />
          </div>
        </div>
      </div>
    </main>
  );
}