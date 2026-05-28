"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Props = {
  fallbackHref: string;
  label?: string;
  className?: string;
};

export function DashboardBackButton({
  fallbackHref,
  label = "Back",
  className = "mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#3d4a41] transition-colors hover:text-[#006d43]",
}: Props) {
  const router = useRouter();

  function handleBack() {
    const referrer = document.referrer;
    if (referrer) {
      try {
        const previous = new URL(referrer);
        const current = new URL(window.location.href);
        if (
          previous.origin === current.origin &&
          previous.pathname !== current.pathname
        ) {
          router.back();
          return;
        }
        if (previous.origin !== current.origin) {
          router.push(fallbackHref);
          return;
        }
      } catch {
        // Fall back below when the referrer cannot be parsed.
      }
    }

    const historyState = window.history.state as { idx?: number } | null;
    if (typeof historyState?.idx === "number" && historyState.idx > 0) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button type="button" onClick={handleBack} className={className}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
