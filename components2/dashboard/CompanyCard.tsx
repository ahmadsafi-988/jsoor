import { MapPin, DollarSign, ExternalLink, Bookmark } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useState } from "react";

interface Company {
  id: number;
  name: string;
  logo: string;
  position: string;
  location: string;
  matchScore: number;
  salary: string;
  tags: string[];
  description: string;
}

interface CompanyCardProps {
  company: Company;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  const getMatchColor = (score: number) => {
    if (score >= 90) return "#06B6D4";
    if (score >= 80) return "#8B5CF6";
    return "#312E81";
  };

  return (
    <div className="bg-white rounded-xl border hover:shadow-xl transition-all duration-300 overflow-hidden group" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
      {/* Match Score Badge */}
      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <div
            className="px-3 py-1.5 rounded-full text-white text-sm flex items-center gap-1 backdrop-blur-sm"
            style={{ backgroundColor: getMatchColor(company.matchScore) }}
          >
            <span className="font-semibold">{company.matchScore}%</span>
            <span className="text-xs">Match</span>
          </div>
        </div>
        
        {/* Company Logo */}
        <div className="p-6 pb-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
            <ImageWithFallback
              src={company.logo}
              alt={company.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl mb-1" style={{ color: '#312E81' }}>
              {company.name}
            </h3>
            <p className="text-sm text-muted-foreground">{company.position}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 space-y-4">
        {/* Location & Salary */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{company.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: '#06B6D4' }}>
            <DollarSign className="w-4 h-4" />
            <span>{company.salary}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {company.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full text-xs border"
              style={{ 
                borderColor: 'rgba(49, 46, 129, 0.2)',
                color: '#312E81',
                backgroundColor: '#EEF2FF'
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {company.description}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            className="flex-1 py-3 rounded-lg text-white transition-all hover:shadow-lg flex items-center justify-center gap-2"
            style={{ backgroundColor: '#06B6D4' }}
          >
            Apply Now
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="px-4 py-3 rounded-lg border transition-all hover:bg-secondary"
            style={{ 
              borderColor: isSaved ? '#8B5CF6' : 'rgba(49, 46, 129, 0.2)',
              color: isSaved ? '#8B5CF6' : '#312E81',
              backgroundColor: isSaved ? '#8B5CF6' + '10' : 'transparent'
            }}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
