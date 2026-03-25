"use client"
import { TrendingUp, Users, Award, Target } from "lucide-react";

export function Statistics() {
  const stats = [
    {
      icon: Users,
      number: "10,000+",
      label: "Active Graduates",
      description: "Successfully placed in top companies",
      color: '#06B6D4',
    },
    {
      icon: Target,
      number: "500+",
      label: "Partner Companies",
      description: "Across multiple industries",
      color: '#312E81',
    },
    {
      icon: Award,
      number: "95%",
      label: "Success Rate",
      description: "Graduates hired within 3 months",
      color: '#8B5CF6',
    },
    {
      icon: TrendingUp,
      number: "40%",
      label: "Higher Salaries",
      description: "Than industry average for roles",
      color: '#06B6D4',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: '#8B5CF6' }} />
            <span className="text-sm" style={{ color: '#8B5CF6' }}>Our Impact</span>
          </div>
          <h2 className="text-3xl sm:text-4xl mb-4" style={{ color: '#312E81' }}>
            Making a Real Difference
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Numbers that showcase our commitment to connecting talent with opportunity
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="relative group"
              >
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                  style={{ backgroundColor: stat.color + '20' }}
                />
                <div className="relative bg-white border rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: stat.color + '15' }}
                  >
                    <Icon className="w-7 h-7" style={{ color: stat.color }} />
                  </div>
                  <div className="text-4xl mb-2" style={{ color: stat.color }}>
                    {stat.number}
                  </div>
                  <h3 className="text-xl mb-2" style={{ color: '#312E81' }}>
                    {stat.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl mb-2" style={{ color: '#312E81' }}>
                2 Weeks
              </div>
              <p className="text-muted-foreground">Average time to first interview</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl mb-2" style={{ color: '#8B5CF6' }}>
                $65K
              </div>
              <p className="text-muted-foreground">Average starting salary</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl mb-2" style={{ color: '#06B6D4' }}>
                4.9/5
              </div>
              <p className="text-muted-foreground">User satisfaction rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
