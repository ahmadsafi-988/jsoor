"use client"
import { ArrowRight, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative pt-0 pb-20 lg:pb-32 overflow-hidden min-h-screen">
        <div className="relative w-full h-full">
          {/* Right Image - Full page width */}
          <div className="absolute inset-0 w-full h-screen lg:h-auto">
            <div className="relative w-full h-full rounded-none overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1767716134877-82b74809e431?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMHJvYm90JTIwYXNzaXN0YW50JTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NzQyODQwNDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="AI Robot Assistant"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
              
              {/* Soft Horizontal Gradient Fade - Left to Right */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent"></div>
            </div>

            {/* Floating Card */}
            {/* <div className="absolute bottom-8 lg:bottom-1/4 right-4 lg:right-32 bg-white rounded-xl shadow-xl p-6 max-w-xs hidden lg:block z-20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full" style={{ backgroundColor: '#8B5CF6' }}></div>
                <div>
                  <div className="text-sm" style={{ color: '#312E81' }}>Sarah Johnson</div>
                  <div className="text-xs text-muted-foreground">Software Engineer</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                <span className="text-sm text-muted-foreground">Hired in 2 weeks</span>
              </div>
            </div> */}
          </div>

          {/* Left Content - On top with z-index, aligned to left */}
          <div className="relative z-10 min-h-screen flex items-center">
            <div className="w-full lg:w-1/2 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                  <CheckCircle className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                  <span className="text-sm" style={{ color: '#8B5CF6' }}>
                    Trusted by 10,000+ Graduates
                  </span>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl" style={{ color: '#312E81', lineHeight: '1.1' }}>
                    Bridge Your Future
                  </h1>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl" style={{ color: '#1E1B4B', lineHeight: '1.1' }}>
                    Connect Talent with Opportunity
                  </h2>
                </div>

                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl" style={{ color: '#312E81', lineHeight: '1.1' }}>
                  The professional platform connecting fresh graduates with leading companies. 
                  Build your career, find your perfect match, and step into your professional future with confidence.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/dashboard">
                    <button 
                      className="group px-8 py-4 rounded-lg text-white transition-all hover:shadow-xl flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#06B6D4' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0891B2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#06B6D4'}
                    >
                      Start Your Journey
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  
                  <button 
                    className="px-8 py-4 rounded-lg border-2 transition-all hover:shadow-lg bg-white"
                    style={{ borderColor: '#312E81', color: '#312E81' }}
                  >
                    For Employers
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
                  <div>
                    <div className="text-3xl mb-1" style={{ color: '#312E81' }}>10K+</div>
                    <div className="text-sm text-muted-foreground">Graduates</div>
                  </div>
                  <div>
                    <div className="text-3xl mb-1" style={{ color: '#312E81' }}>500+</div>
                    <div className="text-sm text-muted-foreground">Companies</div>
                  </div>
                  <div>
                    <div className="text-3xl mb-1" style={{ color: '#8B5CF6' }}>95%</div>
                    <div className="text-sm text-muted-foreground">Match Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}