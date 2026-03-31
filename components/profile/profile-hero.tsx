"use client";

// components/profile/profile-hero.tsx
// Client component — handles interactive parts of the profile header.
// Kept separate so the main page.tsx can remain a Server Component.

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Link2,
  Mail,
  Calendar,
  GitBranch,
  XIcon,
  Pencil,
} from "lucide-react";
import { type User } from "@/lib/profile/profile.types";

// ─── Bio expand/collapse ──────────────────────────────────────────────────────
const BIO_CHAR_LIMIT = 160;

function BioSection({ bio }: { bio: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = bio.length > BIO_CHAR_LIMIT;
  const displayed = isLong && !expanded ? bio.slice(0, BIO_CHAR_LIMIT).trimEnd() + "…" : bio;
  return (
    <div className="mt-2 text-sm text-muted-foreground">
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

function InlineStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="font-semibold text-foreground">{value.toLocaleString()}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Profile Hero ─────────────────────────────────────────────────────────────
export function ProfileHero({
  user,
  isOwnProfile,
}: {
  user: User;
  isOwnProfile: boolean;
}) {
  return (
    <>
      {/* Cover */}
      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4">
        {/* Avatar + actions */}
        <div className="flex items-end justify-between">
          <Avatar className="-mt-14 h-28 w-28 border-4 border-background shadow-xl ring-2 ring-muted">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-2xl">{user.name.slice(0, 2)}</AvatarFallback>
          </Avatar>

          <div className="mb-2 flex gap-2">
            {isOwnProfile && (
              <Button variant="outline" size="sm">
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit Profile
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Mail className="mr-1.5 h-4 w-4" />
              Message
            </Button>
            <Button size="sm">Follow</Button>
          </div>
        </div>

        {/* Identity */}
        <div className="mt-3 space-y-1">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.username}</p>
          <BioSection bio={user.bio} />
        </div>

        {/* Stats */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <InlineStat label="Followers" value={user.stats.followers} />
          <span className="text-xs text-muted-foreground/40">·</span>
          <InlineStat label="Following" value={user.stats.following} />
        </div>

        {/* Meta links */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />{user.location}
          </span>
          <a href={`https://${user.website}`} className="flex items-center gap-1 hover:text-foreground">
            <Link2 className="h-3.5 w-3.5" />{user.website}
          </a>
          <a href={`https://x.com/${user.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
            <XIcon className="h-3.5 w-3.5" />@{user.twitter}
          </a>
          <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
            <GitBranch className="h-3.5 w-3.5" />{user.github}
          </a>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />Joined {user.joinedDate}
          </span>
        </div>
      </div>
    </>
  );
}