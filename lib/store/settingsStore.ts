"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FeedbackMode, UserSettings } from "@/lib/storage/schema";

interface SettingsActions {
  setResetHour(hour: number): void;
  setHasOnboarded(value: boolean): void;
  setFeedbackMode(mode: FeedbackMode): void;
}

type SettingsStore = UserSettings & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      resetHour: 5,
      hasOnboarded: false,
      feedbackMode: "haptic",

      setResetHour(hour) {
        if (hour < 0 || hour > 23.5 || hour % 0.5 !== 0) {
          throw new Error(`Invalid reset hour: ${hour}. Must be 0–23.5 in 0.5 steps.`);
        }
        set({ resetHour: hour });
      },
      setHasOnboarded(value) {
        set({ hasOnboarded: value });
      },
      setFeedbackMode(mode) {
        set({ feedbackMode: mode });
      },
    }),
    {
      name: "wird-settings",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 5,
      migrate: (persistedState, version) => {
        const state =
          persistedState && typeof persistedState === "object"
            ? (persistedState as Partial<UserSettings>)
            : {};

        return {
          resetHour: version < 4 ? 5 : state.resetHour ?? 5,
          // v4 intentionally re-ran onboarding so users could choose reset hour.
          hasOnboarded: version < 4 ? false : state.hasOnboarded ?? false,
          feedbackMode: state.feedbackMode ?? "haptic",
        };
      },
    }
  )
);
