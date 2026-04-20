"use client";
import { Calendar, ArrowRight, BookOpen, TrendingUp, Users } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const posts = [
  {
    category: "Career Tips",
    icon: TrendingUp,
    title: "10 Essential Skills Every Graduate Needs in 2026",
    excerpt:
      "Discover the most in-demand skills that will make you stand out to employers in today's competitive job market.",
    date: "March 20, 2026",
    readTime: "5 min read",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
  {
    category: "Success Stories",
    icon: Users,
    title: "From Graduation to Google: Sarah's Journey",
    excerpt:
      "Learn how Sarah landed her dream job at Google just 3 weeks after graduation using JSOOR.",
    date: "March 18, 2026",
    readTime: "7 min read",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
  {
    category: "Industry Insights",
    icon: BookOpen,
    title: "Tech Industry Hiring Trends for 2026",
    excerpt:
      "An in-depth analysis of the latest hiring trends, salaries, and opportunities in the technology sector.",
    date: "March 15, 2026",
    readTime: "8 min read",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  },
];

export function Blog() {
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

        <div className="grid lg:grid-cols-3 gap-6">
          {posts.map((post, index) => {
            const Icon = post.icon;
            return (
              <article
                key={index}
                className="group bg-white rounded-2xl overflow-hidden border border-[#e5e2e1] hover:shadow-[0_20px_40px_rgba(0,109,67,0.08)] hover:border-[#006d43]/20 transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={post.image}
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
                      {post.date}
                    </span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h3 className="font-headline text-base font-semibold text-[#1c1b1b] mb-2 leading-snug group-hover:text-[#006d43] transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-sm text-[#3d4a41] leading-relaxed mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  <button className="inline-flex items-center gap-1.5 text-sm font-medium text-[#006d43] hover:text-[#00a86b] transition-colors group/btn">
                    Read More
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-3 text-sm font-semibold text-[#006d43] border-2 border-[#006d43] rounded-xl hover:bg-[#006d43] hover:text-white transition-colors">
            View All Articles
          </button>
        </div>
      </div>
    </section>
  );
}
