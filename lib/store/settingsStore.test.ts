import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "@/lib/store/settingsStore";

beforeEach(() => {
  useSettingsStore.setState({ resetHour: 5, hasOnboarded: false });
});

describe("settingsStore.setResetHour", () => {
  it("initial resetHour is 5", () => {
    expect(useSettingsStore.getState().resetHour).toBe(5);
  });

  it("setResetHour stores a valid hour", () => {
    useSettingsStore.getState().setResetHour(3);
    expect(useSettingsStore.getState().resetHour).toBe(3);
  });

  it("setResetHour accepts boundary values 0 and 23", () => {
    useSettingsStore.getState().setResetHour(0);
    expect(useSettingsStore.getState().resetHour).toBe(0);
    useSettingsStore.getState().setResetHour(23);
    expect(useSettingsStore.getState().resetHour).toBe(23);
  });

  it("setResetHour throws on out-of-range values", () => {
    expect(() => useSettingsStore.getState().setResetHour(-1)).toThrow();
    expect(() => useSettingsStore.getState().setResetHour(24)).toThrow();
  });
});

describe("settingsStore.setHasOnboarded", () => {
  it("initial hasOnboarded is false", () => {
    expect(useSettingsStore.getState().hasOnboarded).toBe(false);
  });

  it("setHasOnboarded stores true", () => {
    useSettingsStore.getState().setHasOnboarded(true);
    expect(useSettingsStore.getState().hasOnboarded).toBe(true);
  });

  it("setHasOnboarded can be reset to false", () => {
    useSettingsStore.getState().setHasOnboarded(true);
    useSettingsStore.getState().setHasOnboarded(false);
    expect(useSettingsStore.getState().hasOnboarded).toBe(false);
  });
});
