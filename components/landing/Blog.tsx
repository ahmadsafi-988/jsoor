"use client";

import { ArrowRight, BookOpen, Calendar, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { getBlogImageSrc } from "@/lib/blogs/constants";
import type { BlogRow } from "@/lib/blogs/data";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  "Career Tips": TrendingUp,
  "Success Stories": Users,
  "Industry Insights": BookOpen,
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function BlogCard({ post }: { post: BlogRow }) {
  const Icon = CATEGORY_ICONS[post.category] ?? BookOpen;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-[#e5e2e1] hover:shadow-[0_20px_40px_rgba(0,109,67,0.08)] hover:border-[#006d43]/20 transition-all duration-300"
    >
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback
          src={getBlogImageSrc(post.image_url)}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white bg-[#006d43]">
          <Icon className="w-3 h-3" />
          {post.category}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 text-xs text-[#3d4a41] mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(post.created_at)}
          </span>
          <span>-</span>
          <span>{post.read_time ?? "5 min read"}</span>
        </div>

        <h3 className="font-headline text-base font-semibold text-[#1c1b1b] mb-2 leading-snug group-hover:text-[#006d43] transition-colors">
          {post.title}
        </h3>

        <p className="text-sm text-[#3d4a41] leading-relaxed mb-4 line-clamp-2">
          {post.excerpt}
        </p>

        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#006d43] group-hover:text-[#00a86b] transition-colors group/btn">
          Read More
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

export function Blog({ posts }: { posts: BlogRow[] }) {
  return (
    <section id="blog" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#78fbb6]/20 border border-[#bccabe] mb-4">
            <BookOpen className="w-3.5 h-3.5 text-[#006d43]" />
            <span className="text-sm font-medium text-[#006d43]">Resources</span>
          </div>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-[#1c1b1b] mb-4 tracking-tight">
            Latest Insights & Stories
          </h2>
          <p className="text-lg text-[#3d4a41] max-w-xl mx-auto">
            Career advice, success stories, and industry insights to help you succeed.
          </p>
        </div>

        {posts.length > 0 ? (
          <>
            <div className="grid lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#006d43] to-[#00a86b] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#00a86b]/20 transition-all hover:brightness-110"
              >
                Show More
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-[#3d4a41]">
            <p className="text-lg font-semibold text-[#1c1b1b] mb-2">No articles yet</p>
            <p className="text-sm">Check back soon for new career resources.</p>
          </div>
        )}
      </div>
    </section>
  );
}
