import { Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { Trust } from "@/components/landing/Trust";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { Blog } from "@/components/landing/Blog";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { getPublishedBlogs } from "@/lib/blogs/data";

export default async function Home() {
  const posts = await getPublishedBlogs(3);

  return (
    <div className="flex flex-col min-h-screen pt-[88px]">
      <Navbar />
      <main className="flex-grow">
        <section id="hero">
          <Hero />
        </section>
        <section id="stats">
          <Suspense fallback={<div className="bg-neutral-900 py-16" />}>
            <Stats />
          </Suspense>
        </section>
        <section id="trust">
          <Trust />
        </section>
        <section id="features">
          <Features />
        </section>
        <section id="how-it-works">
          <HowItWorks />
        </section>
        <section id="testimonials">
          <Testimonials />
        </section>
        <section id="blog">
          <Blog posts={posts} />
        </section>
        <section id="faq">
          <FAQ />
        </section>
      </main>
      <Footer />
    </div>
  );
}
