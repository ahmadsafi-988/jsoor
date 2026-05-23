"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import {
  openConversationWithCompany,
  openConversationWithJobSeeker,
} from "@/lib/messages/actions";

type Props =
  | {
      mode: "job-seeker-company";
      companyId: string;
      applicationId?: string;
      className?: string;
      label?: string;
    }
  | {
      mode: "company-job-seeker";
      jobSeekerId: string;
      applicationId?: string;
      className?: string;
      label?: string;
    };

const DEFAULT_CLASS =
  "inline-flex w-fit items-center gap-2 rounded-xl border border-[#006d43] px-4 py-2 text-sm font-semibold text-[#006d43] transition-colors hover:bg-[#006d43] hover:text-white disabled:cursor-not-allowed disabled:opacity-60";

export function MessageActionButton(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result =
        props.mode === "job-seeker-company"
          ? await openConversationWithCompany(props.companyId, props.applicationId)
          : await openConversationWithJobSeeker(
              props.jobSeekerId,
              props.applicationId,
            );

      if ("conversationId" in result) {
        const baseHref =
          props.mode === "job-seeker-company"
            ? "/job-seeker/messages"
            : "/company/messages";
        router.push(`${baseHref}?conv=${result.conversationId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={props.className ?? DEFAULT_CLASS}
      >
        <MessageSquare className="h-4 w-4" />
        {isPending ? "Opening..." : props.label ?? "Message"}
      </button>
      {error && (
        <p className="max-w-xs text-left text-xs leading-5 text-red-600 sm:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
