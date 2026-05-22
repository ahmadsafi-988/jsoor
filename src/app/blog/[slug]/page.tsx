import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { getBlogImageSrc } from "@/lib/blogs/constants";
import { getPublishedBlogBySlug } from "@/lib/blogs/data";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getPublishedBlogBySlug(slug);
  if (!blog) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#fcf9f8] pt-[88px]">
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href="/#blog"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-[#3d4a41] hover:text-[#006d43] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to articles
          </Link>

          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#bccabe] bg-[#78fbb6]/20 px-3 py-1 text-sm font-medium text-[#006d43]">
            <BookOpen className="h-3.5 w-3.5" />
            {blog.category}
          </div>

          <h1 className="font-headline text-4xl font-bold tracking-tight text-[#1c1b1b] sm:text-5xl">
            {blog.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[#3d4a41]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(blog.created_at)}
            </span>
            <span>-</span>
            <span>{blog.read_time ?? "5 min read"}</span>
          </div>

          <p className="mt-6 text-lg leading-relaxed text-[#3d4a41]">
            {blog.excerpt}
          </p>

          <div className="mt-10 overflow-hidden rounded-2xl border border-[#e5e2e1] bg-white">
            <ImageWithFallback
              src={getBlogImageSrc(blog.image_url)}
              alt={blog.title}
              className="h-[360px] w-full object-cover"
            />
          </div>

          <div className="mt-10 whitespace-pre-line rounded-2xl border border-[#e5e2e1] bg-white p-8 text-base leading-8 text-[#3d4a41] shadow-sm">
            {blog.content}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
