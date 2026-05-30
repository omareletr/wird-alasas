"use client";
import { useEffect, useRef } from "react";

/** Acquires a screen wake lock on mount, re-acquires after tab switch, releases on unmount.
 *  Silent no-op on browsers that don't support the Wake Lock API. */
export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  async function acquire() {
    if (!("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      // Silently fail — wake lock is an enhancement, not a requirement
    }
  }

  useEffect(() => {
    acquire();

    async function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        await acquire();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);
}
