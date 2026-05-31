"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinForum, leaveForum } from "@/lib/forums/actions";

export function CommunityJoinButton({
  forumId,
  forumSlug,
  isJoined,
  compact = false,
}: {
  forumId: string;
  forumSlug: string;
  isJoined: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = isJoined
        ? await leaveForum(forumId, forumSlug)
        : await joinForum(forumId, forumSlug);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={`inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
          compact ? "px-3 py-2" : "px-4 py-2.5"
        } ${
          isJoined
            ? "border border-[#bccabe] bg-white text-[#006d43] hover:bg-[#f6f3f2]"
            : "bg-[#006d43] text-white hover:bg-[#005735]"
        }`}
      >
        {isPending ? "Saving..." : isJoined ? "Joined" : "Join Community"}
      </button>
      {error && <span className="max-w-44 text-right text-xs text-red-600">{error}</span>}
    </div>
  );
}
