import { TrendingUp, Briefcase, CheckCircle, Clock, Video, Sparkles } from "lucide-react";
import { CompanyCard } from "../components/dashboard/CompanyCard";
import { Link } from "react-router";

export function JobMatches() {
  const stats = [
    {
      icon: Briefcase,
      label: "Total Matches",
      value: "24",
      change: "+3 this week",
      color: "#06B6D4",
    },
    {
      icon: TrendingUp,
      label: "Avg Match Score",
      value: "87%",
      change: "+5% from last month",
      color: "#8B5CF6",
    },
    {
      icon: Clock,
      label: "Applications",
      value: "12",
      change: "3 pending",
      color: "#312E81",
    },
    {
      icon: CheckCircle,
      label: "Interviews",
      value: "5",
      change: "2 scheduled",
      color: "#06B6D4",
    },
  ];

  const companies = [
    {
      id: 1,
      name: "Google",
      logo: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      position: "Software Engineering Intern",
      location: "Mountain View, CA",
      matchScore: 95,
      salary: "$8,000 - $10,000/month",
      tags: ["Full-time", "Remote", "Visa Sponsor"],
      description: "Join our world-class engineering team and work on products used by billions.",
    },
    {
      id: 2,
      name: "Microsoft",
      logo: "https://images.unsplash.com/photo-1633409361618-c73427e4e206?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      position: "Cloud Developer Intern",
      location: "Redmond, WA",
      matchScore: 92,
      salary: "$7,500 - $9,500/month",
      tags: ["Full-time", "Hybrid", "Tech"],
      description: "Build the future of cloud computing with Azure and cutting-edge technologies.",
    },
    {
      id: 3,
      name: "Meta",
      logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      position: "Frontend Engineer Intern",
      location: "Menlo Park, CA",
      matchScore: 90,
      salary: "$8,500 - $10,500/month",
      tags: ["Full-time", "On-site", "React"],
      description: "Create immersive experiences for billions of users across Facebook, Instagram, and WhatsApp.",
    },
    {
      id: 4,
      name: "Amazon",
      logo: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      position: "SDE Intern",
      location: "Seattle, WA",
      matchScore: 88,
      salary: "$7,000 - $9,000/month",
      tags: ["Full-time", "Hybrid"],
      description: "Innovate on behalf of customers and solve complex problems at massive scale.",
    },
    {
      id: 5,
      name: "Apple",
      logo: "https://images.unsplash.com/photo-1621768216002-5ac171876625?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      position: "iOS Developer Intern",
      location: "Cupertino, CA",
      matchScore: 87,
      salary: "$8,000 - $10,000/month",
      tags: ["Full-time", "On-site", "Swift"],
      description: "Help create the next generation of Apple products and services.",
    },
    {
      id: 6,
      name: "Netflix",
      logo: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      position: "Backend Engineer Intern",
      location: "Los Gatos, CA",
      matchScore: 85,
      salary: "$7,500 - $9,500/month",
      tags: ["Full-time", "Remote", "Java"],
      description: "Build scalable systems that entertain millions of members worldwide.",
    },
    {
      id: 7,
      name: "Tesla",
      logo: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      position: "Embedded Systems Intern",
      location: "Palo Alto, CA",
      matchScore: 83,
      salary: "$6,500 - $8,500/month",
      tags: ["Full-time", "On-site", "C++"],
      description: "Accelerate the world's transition to sustainable energy.",
    },
    {
      id: 8,
      name: "Spotify",
      logo: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      position: "Data Science Intern",
      location: "New York, NY",
      matchScore: 81,
      salary: "$7,000 - $9,000/month",
      tags: ["Full-time", "Hybrid", "Python"],
      description: "Use data to unlock the potential of human creativity.",
    },
    {
      id: 9,
      name: "Airbnb",
      logo: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200",
      position: "Full Stack Intern",
      location: "San Francisco, CA",
      matchScore: 79,
      salary: "$7,500 - $9,500/month",
      tags: ["Full-time", "Remote"],
      description: "Create a world where anyone can belong anywhere.",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Overview */}
      <div>
        <h1 className="text-3xl mb-6" style={{ color: '#312E81' }}>
          Job Matches
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border"
                style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: stat.color + '15' }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-3xl mb-1" style={{ color: '#312E81' }}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
                <div className="text-xs" style={{ color: stat.color }}>
                  {stat.change}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border flex flex-wrap items-center gap-3" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
        <span className="text-sm" style={{ color: '#312E81' }}>Filter by:</span>
        <button className="px-4 py-2 rounded-lg text-sm text-white" style={{ backgroundColor: '#312E81' }}>
          All Matches
        </button>
        <button className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: 'rgba(49, 46, 129, 0.2)', color: '#312E81' }}>
          90%+ Match
        </button>
        <button className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: 'rgba(49, 46, 129, 0.2)', color: '#312E81' }}>
          Remote
        </button>
        <button className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: 'rgba(49, 46, 129, 0.2)', color: '#312E81' }}>
          Full-time
        </button>
        <button className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: 'rgba(49, 46, 129, 0.2)', color: '#312E81' }}>
          Visa Sponsor
        </button>
      </div>

      {/* Interview Practice CTA */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-2xl font-semibold">
                  Prepare for Your Interviews
                </h3>
              </div>
              <p className="text-white/90">
                Practice with our AI interview simulator and boost your confidence before the real thing.
              </p>
            </div>
          </div>
          <Link to="/interview">
            <button
              className="px-8 py-4 rounded-lg bg-white text-indigo-600 font-semibold transition-all hover:shadow-xl whitespace-nowrap"
            >
              Try Interview Simulator
            </button>
          </Link>
        </div>
      </div>

      {/* Company Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    </div>
  );
}