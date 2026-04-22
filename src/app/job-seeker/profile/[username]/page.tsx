// app/job-seeker/profile/[username]/page.tsx
import { notFound } from "next/navigation";
import React from "react";
import { MapPin, Plus, Edit2, Trash2, Download, ExternalLink, Award, GitBranch } from "lucide-react";
import Link from "next/link";

import { getProfileByUsername, getCurrentUserId } from "@/lib/profile/profile_data";
import { getCvSignedUrl } from "@/lib/storage/cv";
import type { project, badge } from "@/lib/global_types";
import type { user } from "@/lib/global_types";

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
    <section className="bg-[#f6f3f2] rounded-xl p-8 relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#78fbb6] rounded-full blur-[100px] opacity-20 pointer-events-none" />
      <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center relative z-10">
        <div className="w-32 h-32 rounded-xl bg-[#e5e2e1] overflow-hidden shrink-0 shadow-[0_20px_40px_rgba(0,109,67,0.08)] flex items-center justify-center">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.first_name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-headline font-bold text-4xl text-[#3d4a41]">
              {user.first_name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h1 className="font-headline text-[2.5rem] font-bold text-[#1c1b1b] leading-tight tracking-tight">
            {user.first_name} {user.last_name}
          </h1>
          <p className="text-[#3d4a41] font-medium mt-1 text-lg">
            {user.degree ?? "Graduate"} · {user.bio ? "Available for Work" : "Open to Opportunities"}
          </p>
          {user.location && (
            <div className="flex items-center gap-2 mt-4 text-[#5f5e5e]">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{user.location}</span>
            </div>
          )}
        </div>

        {isOwnProfile && (
          <Link
            href={`/job-seeker/profile/${username}/edit`}
            className="bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white px-6 py-3 rounded-lg font-semibold hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,168,107,0.4)] transition-all shrink-0 text-sm"
          >
            Edit Profile
          </Link>
        )}
      </div>
    </section>
  );
}

// ─── Experience / Bio Section ──────────────────────────────────────────────────
function ExperienceSection({ bio }: { bio: string | null }) {
  return (
    <section className="bg-white rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-headline text-[1.75rem] font-medium text-[#1c1b1b]">
          About
        </h2>
        <button className="text-[#006d43] hover:bg-[#f6f3f2] p-2 rounded-full transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {bio ? (
        <p className="text-[#3d4a41] leading-relaxed">{bio}</p>
      ) : (
        <p className="text-[#5f5e5e] text-sm italic">No bio added yet.</p>
      )}
    </section>
  );
}

// ─── Projects Section ─────────────────────────────────────────────────────────
function ProjectsSection({ projects }: { projects: project[] }) {
  if (projects.length === 0) return null;
  return (
    <section className="bg-white rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-headline text-[1.75rem] font-medium text-[#1c1b1b]">
          Projects
        </h2>
      </div>
      <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-[#e5e2e1]">
        {projects.map((project) => (
          <div key={project.id} className="relative pl-10">
            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#f6f3f2] border-2 border-[#006d43] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#78fbb6] shadow-[0_0_10px_rgba(120,251,182,0.8)]" />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-[#1c1b1b]">{project.name}</h3>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  project.status === "Live"
                    ? "bg-[#78fbb6]/30 text-[#005232]"
                    : "bg-[#e5e2e1] text-[#5f5e5e]"
                }`}>
                  {project.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="text-[#5f5e5e] hover:text-[#006d43] transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="text-[#5f5e5e] hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-[#3d4a41] mt-3 leading-relaxed">{project.description}</p>
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-[#006d43] hover:text-[#00a86b] transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5" />
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
  return (
    <section className="bg-[#f6f3f2] rounded-xl p-8">
      <h2 className="font-headline text-[1.75rem] font-medium text-[#1c1b1b] mb-6">
        Details
      </h2>
      <div className="space-y-5">
        {user.institution && (
          <div>
            <p className="text-sm text-[#5f5e5e] mb-1">Institution</p>
            <p className="font-medium text-[#1c1b1b] text-sm">{user.institution}</p>
          </div>
        )}
        {user.degree && (
          <div>
            <p className="text-sm text-[#5f5e5e] mb-1">Degree</p>
            <p className="font-medium text-[#1c1b1b] text-sm">{user.degree}</p>
          </div>
        )}
        {user.gpa && (
          <div>
            <p className="text-sm text-[#5f5e5e] mb-1">GPA</p>
            <p className="font-medium text-[#1c1b1b] text-sm">{user.gpa}</p>
          </div>
        )}
        {(user.edu_start || user.edu_end) && (
          <div>
            <p className="text-sm text-[#5f5e5e] mb-1">Period</p>
            <p className="font-medium text-[#1c1b1b] text-sm">
              {user.edu_start ?? "?"} — {user.edu_end ?? "Present"}
            </p>
          </div>
        )}
        {user.website && (
          <div>
            <p className="text-sm text-[#5f5e5e] mb-1">Website</p>
            <a
              href={`https://${user.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#006d43] text-sm hover:text-[#00a86b] transition-colors"
            >
              {user.website}
            </a>
          </div>
        )}
        {cvSignedUrl && (
          <a
            href={cvSignedUrl}
            download
            className="flex items-center gap-2 mt-2 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-[0_8px_16px_rgba(0,109,67,0.15)]"
          >
            <Download className="w-4 h-4" />
            Download CV
          </a>
        )}
      </div>
    </section>
  );
}

// ─── Skills Card ──────────────────────────────────────────────────────────────
function SkillsCard({ skills }: { skills: string[] }) {
  return (
    <section className="bg-white rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-headline text-[1.75rem] font-medium text-[#1c1b1b]">
          Skills
        </h2>
      </div>
      <div className="flex flex-wrap gap-3">
        {skills.map((skill) => (
          <span
            key={skill}
            className="bg-[#ebe7e7] text-[#1c1b1b] px-4 py-2 rounded-full text-sm font-medium border border-[#bccabe]/20 hover:border-[#006d43]/50 transition-colors cursor-default"
          >
            {skill}
          </span>
        ))}
        <button className="border border-[#6d7a70] text-[#006d43] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#006d43]/5 transition-colors flex items-center gap-1">
          <Plus className="w-4 h-4" />
          Add Skill
        </button>
      </div>
    </section>
  );
}

// ─── Badges Card ──────────────────────────────────────────────────────────────
function BadgesCard({ badges }: { badges: badge[] }) {
  if (badges.length === 0) return null;
  return (
    <section className="bg-[#f6f3f2] rounded-xl p-8">
      <div className="flex items-center gap-2 mb-6">
        <Award className="w-5 h-5 text-[#006d43]" />
        <h2 className="font-headline text-[1.25rem] font-medium text-[#1c1b1b]">
          Certifications
        </h2>
      </div>
      <div className="space-y-3">
        {badges.map((b) => (
          <a
            key={b.id}
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#e5e2e1] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[#e5e2e1] overflow-hidden shrink-0 flex items-center justify-center">
              <img src={b.image} alt={b.name} className="w-10 h-10 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#1c1b1b] truncate">{b.name}</p>
              <p className="text-xs text-[#5f5e5e] truncate">{b.issuer} · {b.date}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#5f5e5e] shrink-0" />
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
    <div className="p-8 xl:p-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-8">
          <ProfileHeaderCard user={flatUser} isOwnProfile={isOwnProfile} username={username} />
          <ExperienceSection bio={job_seeker_profile.bio} />
          <ProjectsSection projects={projects} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-8">
          <DetailsCard user={flatUser} cvSignedUrl={cvSignedUrl} />
          <SkillsCard skills={skills} />
          <BadgesCard badges={badges} />
        </div>
      </div>
    </div>
  );
}
