"use client";

// components/profile/profile-hero.tsx
// Client component — handles interactive parts of the profile header.
// UI restyled to match the warm beige/green design system from page 3.

import React from "react";
import { MapPin, Link2, Mail, Calendar, Pencil } from "lucide-react";
import type { Tables } from "@/lib/supabase_generated_types";
import Link from "next/link";
import { usePathname } from "next/navigation";

type FlatUser = Tables<"profiles"> & Partial<Tables<"job_seeker_profiles">>;

// ─── Bio expand/collapse ──────────────────────────────────────────────────────
const BIO_CHAR_LIMIT = 160;

function BioSection({ bio }: { bio: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = bio.length > BIO_CHAR_LIMIT;
  const displayed =
    isLong && !expanded ? bio.slice(0, BIO_CHAR_LIMIT).trimEnd() + "…" : bio;

  return (
    <div className="max-w-xl mt-2 text-sm text-[#3d4a41]">
      <span>{displayed}</span>
      {isLong && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="ml-1 text-xs font-medium text-[#006d43] hover:text-[#00a86b] hover:underline transition-colors"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

// ─── Profile Hero ─────────────────────────────────────────────────────────────
export function ProfileHero({
  user,
  isOwnProfile,
}: {
  user: FlatUser;
  isOwnProfile: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Cover — warm gradient matching the new design system */}
      {/* <div className="relative h-44 w-full overflow-hidden bg-[#141414]">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-[#006d43]/30 blur-3xl z-0" />
        <div className="absolute -bottom-10 right-20 h-40 w-40 rounded-full bg-[#78fbb6]/10 blur-3xl z-0" />
      </div> */}

      <div className="mx-auto max-w-5xl px-4">
        {/* Avatar + actions row */}
        <div className="flex items-end justify-between">
          {/* Avatar */}
          <div className=" h-28 w-28 rounded-xl bg-[#e5e2e1] overflow-hidden shrink-0 shadow-[0_20px_40px_rgba(0,109,67,0.12)] border-4 border-[#f6f3f2] flex items-center justify-center">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.first_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bold text-2xl text-[#3d4a41]">
                {user.first_name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="mb-2 flex gap-2">
            {isOwnProfile && (
              <Link
                href={`${pathname}/edit`}
                className="inline-flex items-center gap-1.5 border border-[#bccabe] bg-white text-[#1c1b1b] text-sm font-medium px-4 py-2 rounded-lg hover:border-[#006d43] hover:text-[#006d43] transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Link>
            )}
            <button className="inline-flex items-center gap-1.5 border border-[#bccabe] bg-white text-[#1c1b1b] text-sm font-medium px-4 py-2 rounded-lg hover:border-[#006d43] hover:text-[#006d43] transition-colors">
              <Mail className="h-4 w-4" />
              Message
            </button>
            {!isOwnProfile && (
              <button className="inline-flex items-center gap-1.5 bg-gradient-to-br from-[#006d43] to-[#00a86b] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,168,107,0.4)] transition-all">
                Follow
              </button>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="mt-4 space-y-1">
          <h1 className="text-2xl font-bold text-[#1c1b1b] tracking-tight">
            {user.first_name} {user.last_name}
          </h1>
          {user.username && (
            <p className="text-sm text-[#5f5e5e]">@{user.username}</p>
          )}
          {user.bio && <BioSection bio={user.bio} />}
        </div>

        {/* Meta links */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#5f5e5e]">
          {user.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {user.location}
            </span>
          )}
          {user.website && (
            <a
              href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#006d43] transition-colors"
            >
              <Link2 className="h-3.5 w-3.5" />
              {user.website}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Joined {user.joined_date}
          </span>
        </div>
      </div>
    </>
  );
}
