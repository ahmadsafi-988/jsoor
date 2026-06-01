"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestForumDeletion } from "@/lib/forums/actions";

export function CommunityDeletionRequestButton({
  forumId,
  forumName,
  deletionRequestActive = false,
}: {
  forumId: string;
  forumName: string;
  deletionRequestActive?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function requestDeletion() {
    setMessage(null);
    startTransition(async () => {
      const result = await requestForumDeletion(forumId, reason);
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      setOpen(false);
      setReason("");
      setMessage("Deletion request sent to admins.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending || deletionRequestActive}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
        {deletionRequestActive ? "Deletion requested" : isPending ? "Sending..." : "Request deletion"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-[#e5e2e1] bg-white">
          <DialogHeader>
            <DialogTitle>Request deletion for {forumName}</DialogTitle>
            <DialogDescription>
              Tell admins why this community should be deleted. The reason is optional.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Add a short reason for admins..."
            className="w-full resize-none rounded-xl border border-[#e5e2e1] bg-[#f6f3f2] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200"
          />
          {message && <p className="text-sm text-red-600">{message}</p>}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-[#5f5e5e] hover:bg-[#f6f3f2]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={requestDeletion}
              disabled={isPending}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isPending ? "Sending..." : "Send Request"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
