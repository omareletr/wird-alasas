"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserSettings } from "@/lib/storage/schema";

interface SettingsActions {
  setLocation(loc: { latitude: number; longitude: number } | null): void;
}

type SettingsStore = UserSettings & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Default state
      location: null,

      // Actions
      setLocation(loc) {
        set({ location: loc });
      },
    }),
    {
      name: "wird-settings",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 2,
      // v2: defaultMode removed. Strip all stale keys and keep only location.
      migrate: (persisted: unknown) => ({
        location: (persisted as Record<string, unknown>)?.location ?? null,
      }),
    }
  )
);
