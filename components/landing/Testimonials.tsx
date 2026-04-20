"use client";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Developer",
    company: "TechCorp",
    initials: "AC",
    text: "JSOOR made my job search so much easier. I was matched with my dream company within a week of creating my profile. The platform is intuitive and the matches were spot on!",
    rating: 5,
  },
  {
    name: "Maria Rodriguez",
    role: "Marketing Manager",
    company: "BrandHub",
    initials: "MR",
    text: "As a recent graduate, I was overwhelmed by the job market. JSOOR connected me with verified companies that were actually looking for entry-level talent. Highly recommended!",
    rating: 5,
  },
  {
    name: "James Williams",
    role: "Data Analyst",
    company: "DataInsights",
    initials: "JW",
    text: "The career insights and salary data helped me negotiate a better offer. JSOOR isn't just a job platform — it's a career partner.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-[#f6f3f2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#78fbb6]/20 border border-[#bccabe] mb-4">
            <span className="text-sm font-medium text-[#006d43]">Success Stories</span>
          </div>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-[#1c1b1b] mb-4 tracking-tight">
            Trusted by Thousands of Graduates
          </h2>
          <p className="text-lg text-[#3d4a41]">
            See what our community has to say about their experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative flex flex-col p-7 rounded-2xl border border-[#e5e2e1] hover:shadow-[0_20px_40px_rgba(0,109,67,0.08)] hover:border-[#006d43]/20 bg-white transition-all duration-200"
            >
              <Quote className="absolute top-5 right-5 w-7 h-7 text-[#e5e2e1]" />

              <div className="flex gap-0.5 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#006d43] text-[#006d43]" />
                ))}
              </div>

              <p className="text-sm text-[#3d4a41] leading-relaxed flex-1 mb-6">
                "{testimonial.text}"
              </p>

              <div className="flex items-center gap-3 pt-5 border-t border-[#f0edec]">
                <div className="w-10 h-10 rounded-full bg-[#e5e2e1] shrink-0 flex items-center justify-center">
                  <span className="font-headline font-bold text-sm text-[#1c1b1b]">
                    {testimonial.initials}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1c1b1b]">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-[#3d4a41]">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-sm font-medium text-[#3d4a41] mb-8 uppercase tracking-widest">
            Trusted by leading companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10">
            {["Google", "Microsoft", "Amazon", "Meta", "Apple"].map((company) => (
              <div
                key={company}
                className="font-headline text-xl font-bold text-[#bccabe] hover:text-[#006d43] transition-colors"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
