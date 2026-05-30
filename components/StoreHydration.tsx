"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { runMigrationIfNeeded } from "@/lib/storage/localStorage";

/**
 * Mounts as a child of <body> in layout.tsx.
 * Runs schema migrations and rehydrates both Zustand stores from localStorage
 * inside a useEffect so it only runs client-side — avoids React hydration mismatches.
 * Renders nothing to the DOM.
 */
export function StoreHydration() {
  useEffect(() => {
    runMigrationIfNeeded();
    useSessionStore.persist.rehydrate();
    useSettingsStore.persist.rehydrate();
  }, []);
  return null;
}
