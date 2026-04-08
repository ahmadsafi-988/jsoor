"use client"
import { Mail, ArrowRight } from "lucide-react";
import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setEmail("");
      setSubmitted(false);
    }, 3000);
  };

  return (
    <section className="py-20" style={{ backgroundColor: '#312E81' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: '#8B5CF6' }}>
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4 text-white">
            Stay Updated
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Get the latest career tips, job opportunities, and industry insights delivered to your inbox weekly
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-6 py-4 rounded-lg border-2 border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 transition-colors"
            />
            <button
              type="submit"
              className="group px-8 py-4 rounded-lg text-white transition-all hover:shadow-xl flex items-center justify-center gap-2"
              style={{ backgroundColor: '#06B6D4' }}
            >
              {submitted ? "Subscribed!" : "Subscribe"}
              {!submitted && (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
          <p className="text-sm text-white/60 mt-4 text-center">
            Join 50,000+ professionals. Unsubscribe anytime.
          </p>
        </form>

        <div className="mt-12 grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl mb-2" style={{ color: '#06B6D4' }}>📧</div>
            <p className="text-sm text-white/80">Weekly job alerts</p>
          </div>
          <div>
            <div className="text-2xl mb-2" style={{ color: '#8B5CF6' }}>💡</div>
            <p className="text-sm text-white/80">Career development tips</p>
          </div>
          <div>
            <div className="text-2xl mb-2" style={{ color: '#06B6D4' }}>🎯</div>
            <p className="text-sm text-white/80">Industry insights</p>
          </div>
        </div>
      </div>
    </section>
  );
}
