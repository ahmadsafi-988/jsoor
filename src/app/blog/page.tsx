import { BookOpen } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { BlogCard } from "@/components/landing/Blog";
import { getPublishedBlogs } from "@/lib/blogs/data";

export default async function BlogPage() {
  const posts = await getPublishedBlogs();

  return (
    <div className="flex min-h-screen flex-col bg-[#fcf9f8] pt-[88px]">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#bccabe] bg-[#78fbb6]/20 px-3 py-1">
              <BookOpen className="h-3.5 w-3.5 text-[#006d43]" />
              <span className="text-sm font-medium text-[#006d43]">Resources</span>
            </div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-[#1c1b1b] sm:text-4xl">
              All Insights & Stories
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[#3d4a41]">
              Career advice, success stories, and industry insights for early-career talent.
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#e5e2e1] bg-white px-6 py-16 text-center text-[#3d4a41]">
              <p className="mb-2 text-lg font-semibold text-[#1c1b1b]">No articles yet</p>
              <p className="text-sm">Check back soon for new career resources.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
