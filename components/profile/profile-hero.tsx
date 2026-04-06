"use client";

// components/profile/profile-hero.tsx
// Client component — handles interactive parts of the profile header.

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MapPin, Link2, Mail, Calendar, GitBranch, Pencil } from "lucide-react";
import type { user } from "@/lib/global_types";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Bio expand/collapse ──────────────────────────────────────────────────────
const BIO_CHAR_LIMIT = 160;

function BioSection({ bio }: { bio: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = bio.length > BIO_CHAR_LIMIT;
  const displayed =
    isLong && !expanded ? bio.slice(0, BIO_CHAR_LIMIT).trimEnd() + "…" : bio;

  return (
    <div className="max-w-xl mt-2 text-sm text-muted-foreground">
      <span>{displayed}</span>
      {isLong && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="ml-1 text-xs font-medium text-primary hover:underline"
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
  user: user;
  isOwnProfile: boolean;
}) {
  return (
    <>
      {/* Cover */}
      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4">
        {/* Avatar + actions row */}
        <div className="flex items-end justify-between">
          <Avatar className="-mt-14 h-28 w-28 border-4 border-background shadow-xl ring-2 ring-muted">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.first_name} />
            <AvatarFallback className="text-2xl">
              {user.first_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="mb-2 flex gap-2">
            {/* Edit button — only visible to the profile owner */}
            {isOwnProfile && (

              <Button variant="outline" size="sm" >
                <Pencil className="mr-1.5 h-4 w-4" />
                <Link href={`${usePathname()}/edit`}>
                    Edit Profile
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Mail className="mr-1.5 h-4 w-4" />
              Message
            </Button>
            {/* Hide Follow on own profile */}
            {!isOwnProfile && <Button size="sm">Follow</Button>}
          </div>
        </div>

        {/* Identity */}
        <div className="mt-3 space-y-1">
          <h1 className="text-2xl font-bold">
            {user.first_name} {user.last_name}
          </h1>
          {user.username && (
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          )}
          {user.bio && <BioSection bio={user.bio} />}
        </div>

        {/* Meta links */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {user.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {user.location}
            </span>
          )}
          {user.website && (
            <a
              href={`https://${user.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Link2 className="h-3.5 w-3.5" />
              {user.website}
            </a>
          )}
          {user.github && (
            <a
              href={`https://github.com/${user.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <GitBranch className="h-3.5 w-3.5" />
              {user.github}
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