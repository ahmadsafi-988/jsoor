"use client";

import { useState } from "react";

type ExpandableTextProps = {
  text: string;
  className?: string;
  collapsedClassName?: string;
  minLengthForToggle?: number;
};

export function ExpandableText({
  text,
  className = "",
  collapsedClassName = "line-clamp-3",
  minLengthForToggle = 180,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = text.length > minLengthForToggle;

  return (
    <div className={className}>
      <p className={canExpand && !expanded ? collapsedClassName : ""}>{text}</p>
      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-xs font-medium text-[#006d43] hover:text-[#00a86b] hover:underline transition-colors"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
