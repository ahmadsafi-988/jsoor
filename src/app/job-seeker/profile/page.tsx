"use client";

import React from "react";
// app/profile/page.tsx
// shadcn components needed:
// npx shadcn@latest add avatar badge button card separator tabs

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Link2,
  Mail,
  Calendar,
  FileText,
  Heart,
  Download,
  GitBranch,
  XIcon,
  Award,
  ExternalLink,
  Users,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const user = {
  name: "NAMENAME",
  username: "@username",
  avatar: "",
  bio: "Full-stack engineer & open-source contributor. Building things that matter. Coffee enthusiast ☕ padding padding padding padding padding padding padding padding padding padding ",
  location: "San Francisco, CA",
  website: "sarahchen.dev",
  twitter: "sarahchendev",
  github: "sarahchen",
  email: "sarah@example.com",
  joinedDate: "January 2022",
  cvFile: "/files/sarah-chen-cv.pdf", // place your CV in /public/files/
  stats: {
    followers: 1284,
    following: 348,
    posts: 92,
  },
  skills: ["React", "Next.js", "TypeScript", "Node.js", "Postgres", "Tailwind"],
};

const credlyBadges = [
  {
    id: 1,
    name: "AWS Certified Developer",
    issuer: "Amazon Web Services",
    image:
      "https://images.credly.com/size/80x80/images/b9feab85-1a43-4f6c-99a5-631b88d5461b/image.png",
    url: "https://www.credly.com/badges/example-1",
    date: "Dec 2025",
  },
  {
    id: 2,
    name: "GitHub Actions",
    issuer: "GitHub",
    image:
      "https://images.credly.com/size/80x80/images/89efc3e7-842b-4790-b09b-9ea5efc71ec3/image.png",
    url: "https://www.credly.com/badges/example-2",
    date: "Sep 2025",
  },
  {
    id: 3,
    name: "MongoDB Associate Developer",
    issuer: "MongoDB",
    image:
      "https://images.credly.com/size/80x80/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png",
    url: "https://www.credly.com/badges/example-3",
    date: "Jun 2025",
  },
];

const forums = [
  {
    id: 1,
    name: "nextjs",
    description: "A community for Next.js developers",
    members: 84200,
    joined: "Feb 2024",
  },
  {
    id: 2,
    name: "typescript",
    description: "All things TypeScript",
    members: 112400,
    joined: "Jan 2023",
  },
  {
    id: 3,
    name: "webdev",
    description: "Web development discussions and resources",
    members: 320100,
    joined: "Mar 2022",
  },
  {
    id: 4,
    name: "opensource",
    description: "Open source projects, news, and collaboration",
    members: 47600,
    joined: "Jun 2022",
  },
];

const posts = [
  {
    id: 1,
    title: "Building scalable APIs with Next.js Route Handlers",
    date: "Mar 18, 2026",
    likes: 142,
    readTime: "6 min read",
    forum: "nextjs",
  },
  {
    id: 2,
    title: "Why I switched from Redux to Zustand",
    date: "Feb 29, 2026",
    likes: 98,
    readTime: "4 min read",
    forum: "webdev",
  },
  {
    id: 3,
    title: "Mastering TypeScript generics",
    date: "Jan 15, 2026",
    likes: 217,
    readTime: "8 min read",
    forum: "typescript",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const BIO_CHAR_LIMIT = 120;

function BioSection({ bio }: { bio: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = bio.length > BIO_CHAR_LIMIT;
  const displayed = isLong && !expanded ? bio.slice(0, BIO_CHAR_LIMIT).trimEnd() + "…" : bio;

  return (
    <div className="mt-2 max-w-xl text-sm">
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

function PostCard({ post }: { post: (typeof posts)[0] }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between py-0.5">
        <div className="space-y-0.5">
          <p className="font-medium leading-snug">{post.title}</p>
          <p className="text-xs text-muted-foreground">
            {post.forum} · {post.date} · {post.readTime}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Heart className="h-3.5 w-3.5" />
          {post.likes}
        </div>
      </CardContent>
    </Card>
  );
}

function CVDownloadCard() {
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
          Download my latest CV for a full overview of my experience, education,
          and projects.
        </p>
        <Button asChild size="sm" className="w-full">
          <a href={user.cvFile} download>
            <Download className="mr-2 h-4 w-4" />
            Download CV
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function CredlyBadgesCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Award className="h-4 w-4 text-muted-foreground" />
          Certifications &amp; Badges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {credlyBadges.map((badge) => (
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
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
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

export default function ProfilePage() {
  return (
    <main>
      {/* Cover */}
      <div className="h-40 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

      <div className="mx-auto max-w-5xl px-4 pb-16">
        {/* Avatar + actions */}
        <div className="flex items-end justify-between">
          <Avatar className="-mt-16 h-28 w-28 border-4 border-background shadow-lg">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {user.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="mb-2 flex gap-2">
            <Button variant="outline" size="sm">
              <Mail className="mr-1.5 h-4 w-4" />
              Message
            </Button>
            <Button size="sm">Follow</Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── Left column ── */}
          <div className="flex-1 space-y-4">
            {/* Identity */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.username}</p>
              <BioSection bio={user.bio} />
            </div>

            {/* Inline compact stats */}
            <div className="flex flex-wrap items-center gap-3">
              <InlineStat label="Followers" value={user.stats.followers} />
              <span className="text-muted-foreground/40 text-xs">·</span>
              <InlineStat label="Following" value={user.stats.following} />
              <span className="text-muted-foreground/40 text-xs">·</span>
              <InlineStat label="Posts" value={user.stats.posts} />
            </div>

            {/* Meta links */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {user.location}
              </span>
              <a
                href={`https://${user.website}`}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Link2 className="h-3.5 w-3.5" />
                {user.website}
              </a>
              <a
                href={`https://x.com/${user.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <XIcon className="h-3.5 w-3.5" />
                @{user.twitter}
              </a>
              <a
                href={`https://github.com/${user.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <GitBranch className="h-3.5 w-3.5" />
                {user.github}
              </a>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {user.joinedDate}
              </span>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>

            <Separator />

            {/* Tabs */}
            <Tabs defaultValue="posts">
              <TabsList className="w-full">
                <TabsTrigger value="posts" className="flex-1">
                  Posts
                </TabsTrigger>
                <TabsTrigger value="forums" className="flex-1">
                  Forums
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-4 space-y-3">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </TabsContent>

              <TabsContent value="forums" className="mt-4 space-y-3">
                {forums.map((forum) => (
                  <Card key={forum.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between py-0.5">
                      <div className="space-y-0.5">
                        <p className="font-semibold">{forum.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {forum.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {forum.members.toLocaleString()} members
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Joined {forum.joined}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Right column ── */}
          <div className="w-full space-y-4 lg:w-64 lg:shrink-0">
            <CVDownloadCard />
            <CredlyBadgesCard />
          </div>

        </div>
      </div>
    </main>
  );
}
