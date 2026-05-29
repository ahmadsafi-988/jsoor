"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

import { getOrCreateConversationWithProfile } from "@/lib/messages/actions";

export function MessageProfileButton({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    const result = await getOrCreateConversationWithProfile(targetUserId);
    if ("conversationId" in result) {
      router.push(`/company/messages?conv=${result.conversationId}`);
      return;
    }

    if (result.error === "Not authenticated.") {
      router.push("/auth/login");
      return;
    }

    setError(result.error);
    setPending(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#e5e2e1] bg-white text-sm font-medium text-[#3d4a41] hover:bg-[#f6f3f2] disabled:cursor-wait disabled:opacity-70 transition-colors"
      >
        <Mail className="w-4 h-4" />
        {pending ? "Opening..." : "Message"}
      </button>
      {error && (
        <p className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-[#e5e2e1] bg-white px-3 py-2 text-xs text-[#5f5e5e] shadow-sm">
          {error}
        </p>
      )}
    </div>
  );
}
