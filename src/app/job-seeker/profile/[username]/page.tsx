import { notFound } from "next/navigation";
import React from "react";
import {
  MapPin, Plus, Download, ExternalLink, Award, GitBranch,
  GraduationCap, BookOpen, Star, Globe, Calendar,
} from "lucide-react";
import Link from "next/link";

import { getProfileByUsername, getCurrentUserId } from "@/lib/profile/profile_data";
import { getCvSignedUrl } from "@/lib/storage/cv";
import type { project, badge, user } from "@/lib/global_types";

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
        <div className="flex items-end justify-between -mt-12 mb-4 relative z-10">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.first_name} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full bg-[#e5e2e1] flex items-center justify-center font-headline font-bold text-2xl text-[#3d4a41]">
                {user.first_name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {isOwnProfile && (
            <Link
              href={`/job-seeker/profile/${username}/edit`}
              className="px-4 py-2 rounded-lg border border-[#e5e2e1] text-sm font-medium text-[#3d4a41] hover:bg-[#f6f3f2] transition-colors"
            >
              Edit Profile
            </Link>
          )}
        </div>

        {/* Name + headline */}
        <h1 className="font-headline text-2xl font-bold text-[#1c1b1b] leading-tight">
          {user.first_name} {user.last_name}
        </h1>
        {user.degree && (
          <p className="text-sm text-[#3d4a41] mt-0.5">{user.degree}</p>
        )}
        {user.location && (
          <div className="flex items-center gap-1.5 mt-2 text-[#5f5e5e]">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="text-sm">{user.location}</span>
          </div>
        )}
        {user.bio && (
          <p className="text-sm text-[#5f5e5e] mt-3 leading-relaxed line-clamp-2">{user.bio}</p>
        )}
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
            href={`/job-seeker/profile/${username}/edit`}
            className="p-1.5 rounded-lg text-[#006d43] hover:bg-[#f6f3f2] transition-colors"
            title="Edit bio"
          >
            <Plus className="w-4 h-4" />
          </Link>
        )}
      </div>
      {bio ? (
        <p className="text-sm text-[#3d4a41] leading-relaxed">{bio}</p>
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
              <p className="text-xs text-[#3d4a41] mt-2 leading-relaxed">{project.description}</p>
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
function DetailsCard({ user, cvSignedUrl }: { user: user; cvSignedUrl: string | null }) {
  const hasAny =
    user.institution || user.degree || user.gpa || user.edu_start || user.edu_end || user.website || cvSignedUrl;
  if (!hasAny) return null;

  return (
    <section className="bg-white rounded-2xl p-6 border border-[#e5e2e1] shadow-sm">
      <h2 className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-wider mb-5">Education</h2>
      <div className="space-y-4">
        {user.institution && (
          <div className="flex items-start gap-3">
            <GraduationCap className="w-4 h-4 text-[#006d43] mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-[#5f5e5e]">Institution</p>
              <p className="text-sm font-medium text-[#1c1b1b]">{user.institution}</p>
            </div>
          </div>
        )}
        {user.degree && (
          <div className="flex items-start gap-3">
            <BookOpen className="w-4 h-4 text-[#006d43] mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-[#5f5e5e]">Degree</p>
              <p className="text-sm font-medium text-[#1c1b1b]">{user.degree}</p>
            </div>
          </div>
        )}
        {user.gpa && (
          <div className="flex items-start gap-3">
            <Star className="w-4 h-4 text-[#006d43] mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-[#5f5e5e]">GPA</p>
              <p className="text-sm font-medium text-[#1c1b1b]">{user.gpa}</p>
            </div>
          </div>
        )}
        {(user.edu_start || user.edu_end) && (
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-[#006d43] mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-[#5f5e5e]">Period</p>
              <p className="text-sm font-medium text-[#1c1b1b]">
                {user.edu_start ?? "?"} — {user.edu_end ?? "Present"}
              </p>
            </div>
          </div>
        )}
        {user.website && (
          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 text-[#006d43] mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-[#5f5e5e]">Website</p>
              <a
                href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#006d43] hover:underline break-all"
              >
                {user.website}
              </a>
            </div>
          </div>
        )}
        {cvSignedUrl && (
          <a
            href={cvSignedUrl}
            download
            className="flex items-center justify-center gap-2 mt-2 w-full bg-[#f6f3f2] border border-[#e5e2e1] text-[#1c1b1b] px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#e5e2e1] transition-colors"
          >
            <Download className="w-4 h-4 text-[#006d43]" />
            Download CV
          </a>
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
            href={`/job-seeker/profile/${username}/edit`}
            className="flex items-center gap-1 text-xs font-medium text-[#006d43] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </Link>
        )}
      </div>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="bg-[#f0f9f5] text-[#005232] text-xs px-3 py-1.5 rounded-full font-medium border border-[#78fbb6]/40"
            >
              {skill}
            </span>
          ))}
        </div>
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

  const { profile_base, job_seeker_profile, projects, badges, skills } = profileData;
  const isOwnProfile = currentUserId === profile_base.id;
  const flatUser = { ...profile_base, ...job_seeker_profile };

  const cvSignedUrl = job_seeker_profile.cv_url
    ? await getCvSignedUrl(job_seeker_profile.cv_url)
    : null;

  return (
    <div className="p-6 xl:p-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          <ProfileHeaderCard user={flatUser} isOwnProfile={isOwnProfile} username={username} />
          <AboutSection bio={job_seeker_profile.bio} isOwnProfile={isOwnProfile} username={username} />
          <ProjectsSection projects={projects} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-6">
          <DetailsCard user={flatUser} cvSignedUrl={cvSignedUrl} />
          <SkillsCard skills={skills} isOwnProfile={isOwnProfile} username={username} />
          <BadgesCard badges={badges} />
        </div>
      </div>
    </div>
  );
}
