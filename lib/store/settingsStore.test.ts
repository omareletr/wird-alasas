import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "@/lib/store/settingsStore";

beforeEach(() => {
  useSettingsStore.setState({ location: null });
});

describe("settingsStore.setLocation", () => {
  it("initial location is null", () => {
    expect(useSettingsStore.getState().location).toBeNull();
  });

  it("setLocation stores coordinates", () => {
    useSettingsStore.getState().setLocation({ latitude: 21.4225, longitude: 39.8262 });
    expect(useSettingsStore.getState().location).toEqual({ latitude: 21.4225, longitude: 39.8262 });
  });

  it("setLocation(null) clears location", () => {
    useSettingsStore.getState().setLocation({ latitude: 21.4225, longitude: 39.8262 });
    useSettingsStore.getState().setLocation(null);
    expect(useSettingsStore.getState().location).toBeNull();
  });
});
