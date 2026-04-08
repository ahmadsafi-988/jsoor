"use client"
import { Calendar, ArrowRight, BookOpen, TrendingUp, Users } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

export function Blog() {
  const posts = [
    {
      category: "Career Tips",
      icon: TrendingUp,
      title: "10 Essential Skills Every Graduate Needs in 2026",
      excerpt: "Discover the most in-demand skills that will make you stand out to employers in today's competitive job market.",
      date: "March 20, 2026",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    },
    {
      category: "Success Stories",
      icon: Users,
      title: "From Graduation to Google: Sarah's Journey",
      excerpt: "Learn how Sarah landed her dream job at Google just 3 weeks after graduation using The Professional Bridge.",
      date: "March 18, 2026",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    },
    {
      category: "Industry Insights",
      icon: BookOpen,
      title: "Tech Industry Hiring Trends for 2026",
      excerpt: "An in-depth analysis of the latest hiring trends, salaries, and opportunities in the technology sector.",
      date: "March 15, 2026",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    },
  ];

  return (
    <section className="py-20" style={{ backgroundColor: '#EEF2FF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <BookOpen className="w-4 h-4" style={{ color: '#8B5CF6' }} />
            <span className="text-sm" style={{ color: '#8B5CF6' }}>Resources</span>
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4" style={{ color: '#312E81' }}>
            Latest Insights & Stories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Career advice, success stories, and industry insights to help you succeed
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {posts.map((post, index) => {
            const Icon = post.icon;
            return (
              <article
                key={index}
                className="group bg-white rounded-2xl overflow-hidden border hover:shadow-2xl transition-all duration-300"
                style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}
              >
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs text-white flex items-center gap-1.5" style={{ backgroundColor: '#8B5CF6' }}>
                    <Icon className="w-3 h-3" />
                    {post.category}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </div>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>

                  <h3 className="text-xl mb-3 group-hover:text-primary transition-colors" style={{ color: '#312E81' }}>
                    {post.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  <button className="flex items-center gap-2 text-sm group/btn transition-colors" style={{ color: '#06B6D4' }}>
                    Read More
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <button
            className="px-8 py-4 rounded-lg border-2 transition-all hover:shadow-lg bg-white"
            style={{ borderColor: '#312E81', color: '#312E81' }}
          >
            View All Articles
          </button>
        </div>
      </div>
    </section>
  );
}
