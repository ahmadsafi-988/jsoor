import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Trust } from "@/components/landing/Trust";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { Blog } from "@/components/landing/Blog";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* The ID here matches the Navbar href="#hero" */}
        <section id="hero">
          <Hero />
        </section>

        <section id="trust">
          <Trust />
        </section>

        {/* The ID here matches the Navbar href="#features" */}
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
          <Blog />
        </section>

        <section id="students">
          <div className="py-16">
            <h2 className="text-3xl font-bold text-center">For Students</h2>
            <p className="text-center mt-4">Content for students section.</p>
          </div>
        </section>

        <section id="companies">
          <div className="py-16">
            <h2 className="text-3xl font-bold text-center">For Companies</h2>
            <p className="text-center mt-4">Content for companies section.</p>
          </div>
        </section>

        {/* Add more sections as needed */}
        <section id="faq">
          <FAQ />
        </section>
      </main>
      <Footer />
    </div>
  );
}