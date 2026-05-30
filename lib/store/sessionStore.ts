"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ActiveSession, DhikrIndex } from "@/lib/storage/schema";

interface SessionActions {
  incrementCount(index: DhikrIndex): void;
  setCount(index: DhikrIndex, value: number): void;
  setMode(mode: "full" | "shortened"): void;
  setActiveIndex(index: DhikrIndex): void;
  setSessionStartedAt(ts: number): void;
  reset(): void;
}

type SessionStore = ActiveSession & SessionActions;

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      // Default state
      counts: { 0: 0, 1: 0, 2: 0, 3: 0 },
      mode: "full",
      sessionStartedAt: null,
      activeIndex: 0,

      // Actions
      incrementCount(index) {
        set((state) => ({
          counts: { ...state.counts, [index]: state.counts[index] + 1 },
        }));
      },
      setCount(index, value) {
        set((state) => ({
          counts: { ...state.counts, [index]: value },
        }));
      },
      setMode(mode) {
        set({ mode });
      },
      setActiveIndex(index) {
        set({ activeIndex: index });
      },
      setSessionStartedAt(ts) {
        set({ sessionStartedAt: ts });
      },
      reset() {
        set({ counts: { 0: 0, 1: 0, 2: 0, 3: 0 }, sessionStartedAt: null });
      },
    }),
    {
      name: "wird-session",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      version: 1,
    }
  )
);
