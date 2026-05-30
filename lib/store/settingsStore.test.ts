import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "@/lib/store/settingsStore";

beforeEach(() => {
  useSettingsStore.setState({ defaultMode: "full", location: null });
});

describe("settingsStore.setDefaultMode", () => {
  it("initial defaultMode is 'full'", () => {
    expect(useSettingsStore.getState().defaultMode).toBe("full");
  });

  it("setDefaultMode('shortened') changes defaultMode to 'shortened'", () => {
    useSettingsStore.getState().setDefaultMode("shortened");
    expect(useSettingsStore.getState().defaultMode).toBe("shortened");
  });

  it("setDefaultMode('full') after shortened reverts to 'full'", () => {
    useSettingsStore.getState().setDefaultMode("shortened");
    useSettingsStore.getState().setDefaultMode("full");
    expect(useSettingsStore.getState().defaultMode).toBe("full");
  });
});
