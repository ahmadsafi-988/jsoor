import {
  Award,
  BookOpen,
  ExternalLink,
  GitBranch,
  Globe,
  GraduationCap,
  MapPin,
  Star,
} from "lucide-react";
import { DashboardBackButton } from "@/components/app/DashboardBackButton";
import type { FullJobSeekerProfile } from "@/lib/global_types";
import type { ReactNode } from "react";

type Props = {
  profileData: FullJobSeekerProfile;
  backHref: string;
  messageAction?: ReactNode;
};

export function JobSeekerProfileDetail({
  profileData,
  backHref,
  messageAction,
}: Props) {
  const { profile_base, job_seeker_profile, projects, badges, skills } = profileData;
  const fullName =
    `${profile_base.first_name} ${profile_base.last_name}`.trim() || profile_base.username;

  return (
    <div className="p-6 xl:p-8">
      <div className="mx-auto max-w-5xl">
        <DashboardBackButton fallbackHref={backHref} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white shadow-sm">
              <div className="h-28 bg-gradient-to-br from-[#006d43] via-[#008a55] to-[#00c47a]" />
              <div className="px-6 pb-6">
                <div className="-mt-12 mb-4 flex items-end justify-between gap-4">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-md">
                    {profile_base.avatar_url ? (
                      <img
                        src={profile_base.avatar_url}
                        alt={fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-[#e5e2e1] font-headline text-2xl font-bold text-[#3d4a41]">
                        {profile_base.first_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {messageAction}
                </div>

                <h1 className="font-headline text-2xl font-bold leading-tight text-[#1c1b1b]">
                  {fullName}
                </h1>
                {job_seeker_profile.degree && (
                  <p className="mt-0.5 text-sm text-[#3d4a41]">
                    {job_seeker_profile.degree}
                  </p>
                )}
                {job_seeker_profile.location && (
                  <div className="mt-2 flex items-center gap-1.5 text-[#5f5e5e]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-sm">{job_seeker_profile.location}</span>
                  </div>
                )}
                {job_seeker_profile.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-[#5f5e5e]">
                    {job_seeker_profile.bio}
                  </p>
                )}
              </div>
            </section>

            {projects.length > 0 && (
              <section className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                  Projects
                </h2>
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[#1c1b1b]">{project.name}</h3>
                        <span className="shrink-0 rounded-full bg-[#e5e2e1] px-2 py-0.5 text-[10px] font-semibold text-[#5f5e5e]">
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="mt-2 text-xs leading-relaxed text-[#3d4a41]">
                          {project.description}
                        </p>
                      )}
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#006d43] transition-colors hover:text-[#00a86b]"
                        >
                          <GitBranch className="h-3 w-3" />
                          View project
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                Education
              </h2>
              <div className="space-y-4">
                {job_seeker_profile.institution && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-[#006d43]" />
                    <div>
                      <p className="text-[11px] text-[#5f5e5e]">Institution</p>
                      <p className="text-sm font-medium text-[#1c1b1b]">
                        {job_seeker_profile.institution}
                      </p>
                    </div>
                  </div>
                )}
                {job_seeker_profile.degree && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#006d43]" />
                    <div>
                      <p className="text-[11px] text-[#5f5e5e]">Degree</p>
                      <p className="text-sm font-medium text-[#1c1b1b]">
                        {job_seeker_profile.degree}
                      </p>
                    </div>
                  </div>
                )}
                {job_seeker_profile.gpa && (
                  <div className="flex items-start gap-3">
                    <Star className="mt-0.5 h-4 w-4 shrink-0 text-[#006d43]" />
                    <div>
                      <p className="text-[11px] text-[#5f5e5e]">GPA</p>
                      <p className="text-sm font-medium text-[#1c1b1b]">
                        {job_seeker_profile.gpa}
                      </p>
                    </div>
                  </div>
                )}
                {job_seeker_profile.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#006d43]" />
                    <div>
                      <p className="text-[11px] text-[#5f5e5e]">Website</p>
                      <a
                        href={
                          job_seeker_profile.website.startsWith("http")
                            ? job_seeker_profile.website
                            : `https://${job_seeker_profile.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-[#006d43] hover:underline"
                      >
                        {job_seeker_profile.website}
                      </a>
                    </div>
                  </div>
                )}
                {!job_seeker_profile.institution &&
                  !job_seeker_profile.degree &&
                  !job_seeker_profile.gpa &&
                  !job_seeker_profile.website && (
                    <p className="text-sm italic text-[#5f5e5e]">No public details added yet.</p>
                  )}
              </div>
            </section>

            {skills.length > 0 && (
              <section className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[#78fbb6]/40 bg-[#f0f9f5] px-3 py-1.5 text-xs font-medium text-[#005232]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {badges.length > 0 && (
              <section className="rounded-2xl border border-[#e5e2e1] bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#006d43]" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5f5e5e]">
                    Certifications
                  </h2>
                </div>
                <div className="space-y-1">
                  {badges.map((badge) => (
                    <a
                      key={badge.id}
                      href={badge.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#f6f3f2]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f6f3f2]">
                        <img src={badge.image} alt={badge.name} className="h-8 w-8 object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[#1c1b1b]">
                          {badge.name}
                        </p>
                        <p className="truncate text-[11px] text-[#5f5e5e]">
                          {badge.issuer}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#5f5e5e] opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
