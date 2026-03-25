import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { Partners } from "../components/Partners";
import { Features } from "../components/Features";
import { Statistics } from "../components/Statistics";
import { HowItWorks } from "../components/HowItWorks";
import { Testimonials } from "../components/Testimonials";
import { Pricing } from "../components/Pricing";
import { Trust } from "../components/Trust";
import { Blog } from "../components/Blog";
import { FAQ } from "../components/FAQ";
import { Newsletter } from "../components/Newsletter";
import { CTA } from "../components/CTA";
import { Footer } from "../components/Footer";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Partners />
      <Features />
      <Statistics />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Trust />
      <Blog />
      <FAQ />
      <Newsletter />
      <CTA />
      <Footer />
    </div>
  );
}
