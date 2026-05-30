import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore } from "@/lib/store/sessionStore";

const initialState = {
  counts: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<0 | 1 | 2 | 3, number>,
  mode: "full" as const,
  sessionStartedAt: null,
  activeIndex: 0 as const,
};

beforeEach(() => {
  useSessionStore.setState(initialState);
});

describe("sessionStore.incrementCount", () => {
  it("initial counts are all zero", () => {
    const { counts } = useSessionStore.getState();
    expect(counts[0]).toBe(0);
    expect(counts[1]).toBe(0);
    expect(counts[2]).toBe(0);
    expect(counts[3]).toBe(0);
  });

  it("incrementCount(0) increments only index 0", () => {
    useSessionStore.getState().incrementCount(0);
    const { counts } = useSessionStore.getState();
    expect(counts[0]).toBe(1);
    expect(counts[1]).toBe(0);
    expect(counts[2]).toBe(0);
    expect(counts[3]).toBe(0);
  });

  it("incrementCount(2) three times → counts[2] === 3, others unchanged", () => {
    const state = useSessionStore.getState();
    state.incrementCount(2);
    state.incrementCount(2);
    state.incrementCount(2);
    const { counts } = useSessionStore.getState();
    expect(counts[2]).toBe(3);
    expect(counts[0]).toBe(0);
    expect(counts[1]).toBe(0);
    expect(counts[3]).toBe(0);
  });

  it("incrementCount does not clamp — counts can exceed any target value", () => {
    const state = useSessionStore.getState();
    // Increment 250 times, well beyond any target (max is 200)
    for (let i = 0; i < 250; i++) {
      state.incrementCount(0);
    }
    expect(useSessionStore.getState().counts[0]).toBe(250);
  });

  it("reset() sets all counts to zero and sessionStartedAt to null", () => {
    const state = useSessionStore.getState();
    state.incrementCount(0);
    state.incrementCount(1);
    state.setSessionStartedAt(Date.now());
    state.reset();
    const { counts, sessionStartedAt } = useSessionStore.getState();
    expect(counts[0]).toBe(0);
    expect(counts[1]).toBe(0);
    expect(counts[2]).toBe(0);
    expect(counts[3]).toBe(0);
    expect(sessionStartedAt).toBeNull();
  });
});
