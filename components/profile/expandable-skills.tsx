"use client";

import { useState } from "react";

type ExpandableSkillsProps = {
  skills: string[];
  initialCount?: number;
  className?: string;
  chipClassName?: string;
  buttonClassName?: string;
};

export function ExpandableSkills({
  skills,
  initialCount = 12,
  className = "",
  chipClassName = "bg-[#f0f9f5] text-[#005232] text-xs px-3 py-1.5 rounded-full font-medium border border-[#78fbb6]/40",
  buttonClassName = "text-xs font-medium text-[#006d43] hover:text-[#00a86b] hover:underline transition-colors",
}: ExpandableSkillsProps) {
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = skills.length > initialCount;
  const visibleSkills = hasOverflow && !expanded ? skills.slice(0, initialCount) : skills;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {visibleSkills.map((skill) => (
        <span key={skill} className={chipClassName}>
          {skill}
        </span>
      ))}
      {hasOverflow && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className={buttonClassName}
        >
          {expanded ? "Show fewer" : `Show all ${skills.length}`}
        </button>
      )}
    </div>
  );
}
