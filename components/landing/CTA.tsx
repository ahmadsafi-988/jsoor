"use client"
import { ArrowRight, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import Link from "next/link";

export function CTA() {
  return (
    <section className="py-20" style={{ backgroundColor: '#EEF2FF' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: '#312E81' }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="p-8 lg:p-12 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}>
                <Sparkles className="w-4 h-4" style={{ color: '#8B5CF6' }} />
                <span className="text-sm text-white">
                  Join 10,000+ Graduates
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white" style={{ lineHeight: '1.2' }}>
                Ready to Start Your Professional Journey?
              </h2>

              <p className="text-lg text-white/80 max-w-xl">
                Create your profile today and get matched with opportunities from leading companies 
                looking for talented graduates like you.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth/sign-up">
                  <button 
                    className="group px-8 py-4 rounded-lg text-white transition-all hover:shadow-xl flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#06B6D4' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0891B2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#06B6D4'}
                  >
                    Create Free Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                
                <button className="px-8 py-4 rounded-lg border-2 border-white text-white transition-all hover:bg-white/10">
                  Talk to Sales
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" style={{ color: '#8B5CF6' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Free to join
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" style={{ color: '#8B5CF6' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  No credit card required
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative h-full min-h-[300px] lg:min-h-[500px]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758518730384-be3d205838e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbCUyMGhhbmRzaGFrZSUyMG9mZmljZXxlbnwxfHx8fDE3NzQyODE4OTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Professional handshake"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#312E81] via-transparent to-transparent lg:via-[#312E81]/50"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
