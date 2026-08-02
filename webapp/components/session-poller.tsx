"use client";

import { useEffect } from "react";

interface SessionPollerProps {
  organizationId: string;
  type: "orders" | "availability";
}

export function SessionPoller({ organizationId, type }: SessionPollerProps) {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { verifyTerminalSessionAction } = await import("@/actions/auth-actions");
        const { isValid } = await verifyTerminalSessionAction(organizationId, type);
        if (!isValid) {
          window.location.href = "/";
        }
      } catch (e) {
        // ignore network errors
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [organizationId, type]);

  return null;
}
