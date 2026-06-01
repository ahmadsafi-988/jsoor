"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requestForumDeletion } from "@/lib/forums/actions";

export function CommunityDeletionRequestButton({
  forumId,
  forumName,
}: {
  forumId: string;
  forumName: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function requestDeletion() {
    const reason = prompt(`Request deletion for "${forumName}"? Optional reason:`);
    if (reason === null) return;

    setMessage(null);
    startTransition(async () => {
      const result = await requestForumDeletion(forumId, reason);
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      setMessage("Deletion request sent to admins.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={requestDeletion}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
        {isPending ? "Sending..." : "Request deletion"}
      </button>
      {message && <span className="max-w-48 text-right text-xs text-[#5f5e5e]">{message}</span>}
    </div>
  );
}
