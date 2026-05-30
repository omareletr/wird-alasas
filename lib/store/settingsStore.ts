"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserSettings } from "@/lib/storage/schema";

interface SettingsActions {
  setDefaultMode(mode: "full" | "shortened"): void;
  setLocation(loc: { latitude: number; longitude: number } | null): void;
}

type SettingsStore = UserSettings & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Default state
      defaultMode: "full",
      location: null,

      // Actions
      setDefaultMode(mode) {
        set({ defaultMode: mode });
      },
      setLocation(loc) {
        set({ location: loc });
      },
    }),
    {
      name: "wird-settings",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
    }
  )
);
