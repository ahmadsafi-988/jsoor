"use client";

import { useState } from "react";

const DEFAULT_LIMIT = 160;

export function ExpandableBio({
  bio,
  limit = DEFAULT_LIMIT,
  className = "",
}: {
  bio: string;
  limit?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = bio.length > limit;
  const displayed = isLong && !expanded ? `${bio.slice(0, limit).trimEnd()}...` : bio;

  return (
    <p className={className}>
      <span>{displayed}</span>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="ml-1 text-xs font-medium text-[#006d43] hover:text-[#00a86b] hover:underline transition-colors"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </p>
  );
}
