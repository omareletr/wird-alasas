/**
 * Tests for useFajrRollover.
 * Covers: archiveAndReset, null-session guard, visibilitychange recovery, cleanup.
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockedFunction,
} from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useSessionStore } from "@/lib/store/sessionStore";
import { addDailyRecord } from "@/lib/storage/idb";
import { useFajrRollover, archiveAndReset } from "./useFajrRollover";

// ----- mocks -----

vi.mock("@/lib/storage/idb", () => ({
  addDailyRecord: vi.fn().mockResolvedValue("2026-01-16"),
}));

// adhan mock — fixed Fajr 1 hour from "now"
vi.mock("adhan", () => {
  return {
    Coordinates: vi.fn().mockImplementation(function () { return {}; }),
    CalculationMethod: {
      MuslimWorldLeague: vi.fn().mockReturnValue({}),
    },
    PrayerTimes: vi.fn().mockImplementation(function () {
      return { fajr: new Date(Date.now() + 60 * 60 * 1000) };
    }),
  };
});

const mockedAddDailyRecord = addDailyRecord as MockedFunction<
  typeof addDailyRecord
>;

// ----- helpers -----

const initialSessionState = {
  counts: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<0 | 1 | 2 | 3, number>,
  mode: "full" as const,
  sessionStartedAt: null as number | null,
  activeIndex: 0 as const,
};

// ----- setup -----

beforeEach(() => {
  vi.useFakeTimers();
  useSessionStore.setState(initialSessionState);
  mockedAddDailyRecord.mockClear();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => "visible",
  });
});

afterEach(() => {
  cleanup(); // unmount any renderHook components
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ----- tests: archiveAndReset (exported for direct testing) -----

describe("archiveAndReset — with active session", () => {
  it("calls addDailyRecord with dayKey, counts, mode, completedAt when sessionStartedAt is set", async () => {
    const sessionTs = Date.now() - 1000;
    useSessionStore.setState({
      ...initialSessionState,
      sessionStartedAt: sessionTs,
      counts: { 0: 5, 1: 10, 2: 3, 3: 7 },
      mode: "full",
    });

    const scheduleNext = vi.fn();
    await archiveAndReset(scheduleNext);

    expect(mockedAddDailyRecord).toHaveBeenCalledOnce();
    const callArg = mockedAddDailyRecord.mock.calls[0][0];
    expect(callArg.counts).toEqual({ 0: 5, 1: 10, 2: 3, 3: 7 });
    expect(callArg.mode).toBe("full");
    expect(typeof callArg.dayKey).toBe("string");
    expect(callArg.dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof callArg.completedAt).toBe("number");
  });

  it("calls sessionStore.reset() after archiving", async () => {
    const sessionTs = Date.now() - 1000;
    useSessionStore.setState({
      ...initialSessionState,
      sessionStartedAt: sessionTs,
      counts: { 0: 200, 1: 20, 2: 100, 3: 10 },
    });

    const scheduleNext = vi.fn();
    await archiveAndReset(scheduleNext);

    const { counts, sessionStartedAt } = useSessionStore.getState();
    expect(counts[0]).toBe(0);
    expect(counts[1]).toBe(0);
    expect(sessionStartedAt).toBeNull();
  });

  it("calls scheduleNext after reset", async () => {
    useSessionStore.setState({
      ...initialSessionState,
      sessionStartedAt: Date.now() - 1000,
    });
    const scheduleNext = vi.fn();
    await archiveAndReset(scheduleNext);
    expect(scheduleNext).toHaveBeenCalledOnce();
  });
});

describe("archiveAndReset — with no active session", () => {
  it("skips addDailyRecord when sessionStartedAt is null", async () => {
    useSessionStore.setState({
      ...initialSessionState,
      sessionStartedAt: null,
    });

    const scheduleNext = vi.fn();
    await archiveAndReset(scheduleNext);

    expect(mockedAddDailyRecord).not.toHaveBeenCalled();
  });

  it("still calls reset() and scheduleNext even when no active session", async () => {
    useSessionStore.setState({
      ...initialSessionState,
      sessionStartedAt: null,
      counts: { 0: 0, 1: 0, 2: 0, 3: 0 },
    });

    const scheduleNext = vi.fn();
    await archiveAndReset(scheduleNext);

    const { sessionStartedAt } = useSessionStore.getState();
    expect(sessionStartedAt).toBeNull();
    expect(scheduleNext).toHaveBeenCalledOnce();
  });
});

// ----- tests: useFajrRollover hook lifecycle -----

describe("useFajrRollover — visibilitychange recovery", () => {
  it("does NOT fire archiveAndReset when visibilityState is hidden", async () => {
    useSessionStore.setState({
      ...initialSessionState,
      sessionStartedAt: null,
    });

    renderHook(() => useFajrRollover());

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    expect(mockedAddDailyRecord).not.toHaveBeenCalled();
  });

  it("fires archiveAndReset when tab becomes visible and day has changed", async () => {
    // Set up an active session
    useSessionStore.setState({
      ...initialSessionState,
      sessionStartedAt: Date.now() - 1000,
      counts: { 0: 3, 1: 0, 2: 0, 3: 0 },
    });

    // Mount the hook — storedDay is computed at mount time
    renderHook(() => useFajrRollover());

    // We need getDevotionalDay to return a DIFFERENT value on the next call.
    // Manipulate the mock so that PrayerTimes now returns a Fajr in the PAST
    // (meaning "now" is after Fajr, advancing the devotional day forward).
    // We do this by monkey-patching the adhan PrayerTimes mock to return
    // a fajr that is 2 hours in the past for subsequent calls.
    const { PrayerTimes } = await import("adhan");
    const MockedPT = PrayerTimes as ReturnType<typeof vi.fn>;
    // First invocation (scheduleNext inside hook) already used fajr +1hr.
    // Override for the visibilitychange call — return fajr far in the past
    // so devotionalDay advances.
    MockedPT.mockImplementationOnce(function () {
      return { fajr: new Date(Date.now() - 2 * 60 * 60 * 1000) };
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    expect(mockedAddDailyRecord).toHaveBeenCalled();
  });
});

describe("useFajrRollover — cleanup", () => {
  it("calls clearTimeout on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const { unmount } = renderHook(() => useFajrRollover());
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("removes visibilitychange listener on unmount (no listener fires after unmount)", async () => {
    useSessionStore.setState({
      ...initialSessionState,
      sessionStartedAt: Date.now() - 1000,
    });

    const { unmount } = renderHook(() => useFajrRollover());
    unmount();

    mockedAddDailyRecord.mockClear();

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });

    expect(mockedAddDailyRecord).not.toHaveBeenCalled();
  });
});
