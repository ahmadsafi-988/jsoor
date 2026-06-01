"use client";

import { useEffect } from "react";
import { dispatchUnreadMessagesCleared } from "@/components/app/useUnreadIndicators";

export function UnreadMessagesClearedMarker() {
  useEffect(() => {
    dispatchUnreadMessagesCleared();
  }, []);

  return null;
}
