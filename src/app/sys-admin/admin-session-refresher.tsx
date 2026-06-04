"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 60_000;

export function AdminSessionRefresher() {
  const router = useRouter();
  const { update } = useSession();

  useEffect(() => {
    let cancelled = false;

    async function refreshSession() {
      try {
        await update();

        if (!cancelled) {
          router.refresh();
        }
      } catch {
        // The backend action layer remains authoritative. A failed silent
        // refresh should not interrupt the current admin page by itself.
      }
    }

    const interval = window.setInterval(refreshSession, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [router, update]);

  return null;
}
