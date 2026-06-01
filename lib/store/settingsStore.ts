"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserSettings } from "@/lib/storage/schema";

interface SettingsActions {
  setResetHour(hour: number): void;
  setHasOnboarded(value: boolean): void;
}

type SettingsStore = UserSettings & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      resetHour: 5,
      hasOnboarded: false,

      setResetHour(hour) {
        set({ resetHour: hour });
      },
      setHasOnboarded(value) {
        set({ hasOnboarded: value });
      },
    }),
    {
      name: "wird-settings",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 3,
      migrate: () => ({
        // All users (including existing) get hasOnboarded: false so they see
        // the new onboarding screen and consciously choose their reset hour.
        resetHour: 5,
        hasOnboarded: false,
      }),
    }
  )
);
