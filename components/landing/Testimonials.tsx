"use client"
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Software Developer",
    company: "TechCorp",
    image: "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHByb2Zlc3Npb25hbCUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0MjUyMjc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    text: "JSOOR made my job search so much easier. I was matched with my dream company within a week of creating my profile. The platform is intuitive and the matches were spot on!",
    rating: 5,
  },
  {
    name: "Maria Rodriguez",
    role: "Marketing Manager",
    company: "BrandHub",
    image: "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHByb2Zlc3Npb25hbCUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0MjUyMjc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    text: "As a recent graduate, I was overwhelmed by the job market. JSOOR connected me with verified companies that were actually looking for entry-level talent. Highly recommended!",
    rating: 5,
  },
  {
    name: "James Williams",
    role: "Data Analyst",
    company: "DataInsights",
    image: "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHByb2Zlc3Npb25hbCUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0MjUyMjc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    text: "The career insights and salary data helped me negotiate a better offer. JSOOR isn't just a job platform—it's a career partner.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <span className="text-sm" style={{ color: '#8B5CF6' }}>
              Success Stories
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4" style={{ color: '#312E81' }}>
            Trusted by Thousands of Graduates
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our community has to say about their experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-8 rounded-xl border border-border hover:shadow-xl transition-all bg-white"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 opacity-10" style={{ color: '#06B6D4' }} />
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#8B5CF6' }} />
                ))}
              </div>

              <p className="text-muted-foreground mb-6">
                "{testimonial.text}"
              </p>

              <div className="flex items-center gap-3 pt-6 border-t border-border">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div style={{ color: '#312E81' }}>
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Company Logos */}
        <div className="mt-20 text-center">
          <p className="text-sm text-muted-foreground mb-8">
            Trusted by leading companies worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
            {['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'].map((company) => (
              <div key={company} className="text-2xl" style={{ color: '#1E1B4B' }}>
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}