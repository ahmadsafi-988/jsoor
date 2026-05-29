import { notFound } from "next/navigation";
import React from "react";
import {
  MapPin, Download, ExternalLink, Award, GitBranch,
  GraduationCap, Star, Calendar, FileText,
  Link2, Pencil,
} from "lucide-react";
import Link from "next/link";

import { ExpandableBio } from "@/components/profile/expandable-bio";
import { ExpandableSkills } from "@/components/profile/expandable-skills";
import { ExpandableText } from "@/components/profile/expandable-text";
import { MessageProfileButton } from "@/components/profile/message-profile-button";
import { getProfileByUsername, getCurrentUserId } from "@/lib/profile/profile_data";
import { getCvSignedUrl } from "@/lib/storage/cv";
import type { project, badge, user } from "@/lib/global_types";

function withProtocol(url: string) {
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

function githubUrl(github: string) {
  return withProtocol(github);
}

function githubLabel(github: string) {
  const normalized = withProtocol(github);

  try {
    const url = new URL(normalized);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return github;
  }
}

// ─── Profile Header Card ──────────────────────────────────────────────────────
function ProfileHeaderCard({
  user,
  isOwnProfile,
  username,
}: {
  user: user;
  isOwnProfile: boolean;
  username: string;
}) {
  return (
    <section className="bg-white rounded-2xl overflow-hidden border border-[#e5e2e1] shadow-sm">
      {/* Banner */}
      <div className="h-28 bg-gradient-to-br from-[#006d43] via-[#008a55] to-[#00c47a] relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-black/5 rounded-full" />
        <div className="absolute right-1/3 top-1/4 w-16 h-16 bg-white/5 rounded-full" />
      </div>

      {/* Avatar + actions row */}
      <div className="px-6 pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between -mt-12 mb-4 relative z-10">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.first_name} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full bg-[#e5e2e1] flex items-center justify-center font-headline font-bold text-2xl text-[#3d4a41]">
                {user.first_name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {isOwnProfile && (
              <Link
                href={`/job-seeker/profile/${username}/edit#profile`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#e5e2e1] bg-white text-sm font-medium text-[#3d4a41] hover:bg-[#f6f3f2] transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </Link>
            )}
            {!isOwnProfile && <MessageProfileButton targetUserId={user.id} />}
          </div>
        </div>

        {/* Name + headline */}
        <h1 className="font-headline text-2xl font-bold text-[#1c1b1b] leading-tight">
          {user.first_name} {user.last_name}
        </h1>
        {user.username && (
          <p className="text-sm text-[#5f5e5e] mt-0.5">@{user.username}</p>
        )}
        {user.degree && (
          <p className="text-sm text-[#3d4a41] mt-0.5">{user.degree}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-sm text-[#5f5e5e]">
          {user.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {user.location}
            </span>
          )}
          {user.website && (
            <a
              href={withProtocol(user.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#006d43] transition-colors"
            >
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              {user.website}
            </a>
          )}
          {user.github && (
            <a
              href={githubUrl(user.github)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#006d43] transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 shrink-0" />
              {githubLabel(user.github)}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            Joined {user.joined_date}
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── About Section ────────────────────────────────────────────────────────────
function AboutSection({
  bio,
  isOwnProfile,
  username,
}: {
  bio: string | null;
  isOwnProfile: boolean;
  username: string;
}) {
  if (!bio && !isOwnProfile) return null;
  return (
    <section className="bg-white rounded-2xl p-6 border border-[#e5e2e1] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wider">About</h2>
        {isOwnProfile && (
          <Link
            href={`/job-seeker/profile/${username}/edit#bio`}
            className="p-1.5 rounded-lg text-[#006d43] hover:bg-[#f6f3f2] transition-colors"
            title="Edit bio"
          >
            <Pencil className="w-4 h-4" />
          </Link>
        )}
      </div>
      {bio ? (
        <ExpandableBio
          bio={bio}
          className="text-sm text-[#3d4a41] leading-relaxed"
        />
      ) : (
        <p className="text-sm text-[#5f5e5e] italic">No bio added yet.</p>
      )}
    </section>
  );
}

// ─── Projects Section ─────────────────────────────────────────────────────────
function ProjectsSection({ projects }: { projects: project[] }) {
  if (projects.length === 0) return null;
  return (
    <section className="bg-white rounded-2xl p-6 border border-[#e5e2e1] shadow-sm">
      <h2 className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wider mb-5">Projects</h2>
      <div className="space-y-3">
        {projects.map((project) => (
          <div key={project.id} className="p-4 rounded-xl bg-[#f6f3f2] border border-[#e5e2e1]">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm text-[#1c1b1b]">{project.name}</h3>
              <span
                className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  project.status === "Live"
                    ? "bg-[#78fbb6]/30 text-[#005232]"
                    : "bg-[#e5e2e1] text-[#5f5e5e]"
                }`}
              >
                {project.status}
              </span>
            </div>
            {project.description && (
              <ExpandableText
                text={project.description}
                className="mt-2 text-xs text-[#3d4a41] leading-relaxed"
              />
            )}
            {project.skills && project.skills.length > 0 && (
              <ExpandableSkills
                skills={project.skills}
                initialCount={6}
                className="mt-3"
                chipClassName="bg-white text-[#3d4a41] text-[11px] px-2.5 py-1 rounded-full font-medium border border-[#e5e2e1]"
                buttonClassName="text-[11px] font-medium text-[#006d43] hover:text-[#00a86b] hover:underline transition-colors"
              />
            )}
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-[#006d43] hover:text-[#00a86b] transition-colors"
              >
                <GitBranch className="w-3 h-3" />
                View on GitHub
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Details Card ─────────────────────────────────────────────────────────────
function CvCard({ cvSignedUrl }: { cvSignedUrl: string | null }) {
  if (!cvSignedUrl) return null;

  return (
    <section className="bg-white rounded-2xl p-6 border border-[#e5e2e1] shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-[#006d43]" />
        <h2 className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wider">CV</h2>
      </div>
      <p className="text-xs text-[#5f5e5e] mb-4">
        Download the latest CV for a full overview of education, projects, and experience.
      </p>
      <a
        href={cvSignedUrl}
        download
        className="flex items-center justify-center gap-2 w-full bg-[#f6f3f2] border border-[#e5e2e1] text-[#1c1b1b] px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#e5e2e1] transition-colors"
      >
        <Download className="w-4 h-4 text-[#006d43]" />
        Download CV
      </a>
    </section>
  );
}

function EducationCard({
  user,
  educationLogoUrl,
}: {
  user: user;
  educationLogoUrl: string | null;
}) {
  const hasAny = user.institution || user.degree || user.gpa || user.edu_start || user.edu_end;
  if (!hasAny) return null;

  return (
    <section className="bg-white rounded-2xl p-6 border border-[#e5e2e1] shadow-sm">
      <h2 className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wider mb-5">Education</h2>
      <div>
        {(user.institution || user.degree) && (
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
              {educationLogoUrl ? (
                <img
                  src={educationLogoUrl}
                  alt={`${user.institution} logo`}
                  className="h-full w-full object-contain p-0.5"
                />
              ) : (
                <GraduationCap className="h-5 w-5 text-[#006d43]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {user.institution && (
                <p className="text-sm font-semibold leading-snug text-[#1c1b1b]">{user.institution}</p>
              )}
              {user.degree && (
                <p className="mt-0.5 text-sm text-[#3d4a41]">{user.degree}</p>
              )}
              {(user.gpa || user.edu_start || user.edu_end) && (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#5f5e5e]">
                  {user.gpa && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 text-[#006d43]" />
                      GPA {user.gpa}
                    </span>
                  )}
                  {(user.edu_start || user.edu_end) && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-[#006d43]" />
                      {user.edu_start ?? "?"} - {user.edu_end ?? "Present"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Skills Card ──────────────────────────────────────────────────────────────
function SkillsCard({
  skills,
  isOwnProfile,
  username,
}: {
  skills: string[];
  isOwnProfile: boolean;
  username: string;
}) {
  if (skills.length === 0 && !isOwnProfile) return null;
  return (
    <section className="bg-white rounded-2xl p-6 border border-[#e5e2e1] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wider">Skills</h2>
        {isOwnProfile && (
          <Link
            href={`/job-seeker/profile/${username}/edit#skills`}
            className="p-1.5 rounded-lg text-[#006d43] hover:bg-[#f6f3f2] transition-colors"
            title="Edit skills"
          >
            <Pencil className="w-4 h-4" />
          </Link>
        )}
      </div>
      {skills.length > 0 ? (
        <ExpandableSkills skills={skills} initialCount={12} />
      ) : (
        <p className="text-xs text-[#5f5e5e] italic">No skills added yet.</p>
      )}
    </section>
  );
}

// ─── Badges Card ──────────────────────────────────────────────────────────────
function BadgesCard({ badges }: { badges: badge[] }) {
  if (badges.length === 0) return null;
  return (
    <section className="bg-white rounded-2xl p-6 border border-[#e5e2e1] shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-4 h-4 text-[#006d43]" />
        <h2 className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wider">Certifications</h2>
      </div>
      <div className="space-y-1">
        {badges.map((b) => (
          <a
            key={b.id}
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f6f3f2] transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#f6f3f2] overflow-hidden shrink-0 flex items-center justify-center group-hover:bg-[#e5e2e1] transition-colors">
              <img src={b.image} alt={b.name} className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1c1b1b] truncate">{b.name}</p>
              <p className="text-[11px] text-[#5f5e5e] truncate">{b.issuer} · {b.date}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#5f5e5e] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </section>
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

  const { profile_base, job_seeker_profile, education_logo_url, projects, badges, skills } = profileData;
  const isOwnProfile = currentUserId === profile_base.id;
  const flatUser = { ...profile_base, ...job_seeker_profile };

  const cvSignedUrl = isOwnProfile && job_seeker_profile.cv_url
    ? await getCvSignedUrl(job_seeker_profile.cv_url)
    : null;

  return (
    <div className="p-6 xl:p-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          <ProfileHeaderCard user={flatUser} isOwnProfile={isOwnProfile} username={username} />
          <SkillsCard skills={skills} isOwnProfile={isOwnProfile} username={username} />
          <AboutSection bio={job_seeker_profile.bio} isOwnProfile={isOwnProfile} username={username} />
          <ProjectsSection projects={projects} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-6">
          <CvCard cvSignedUrl={cvSignedUrl} />
          <EducationCard user={flatUser} educationLogoUrl={education_logo_url} />
          <BadgesCard badges={badges} />
        </div>
      </div>
    </div>
  );
}
