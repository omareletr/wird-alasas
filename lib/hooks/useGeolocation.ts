"use client";

import { useState, useEffect, useCallback } from "react";
import { useSettingsStore } from "@/lib/store/settingsStore";

export type GeoStatus =
  | "idle"
  | "loading"
  | "success"
  | "denied"
  | "unavailable"
  | "timeout"
  | "unsupported";

export function useGeolocation(): { status: GeoStatus; retry: () => void } {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const setLocation = useSettingsStore((s) => s.setLocation);

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setStatus("success");
      },
      (err) => {
        const map: Record<number, GeoStatus> = {
          1: "denied",
          2: "unavailable",
          3: "timeout",
        };
        setStatus(map[err.code] ?? "unavailable");
      },
      { timeout: 8000, maximumAge: 60 * 1000, enableHighAccuracy: false }
    );
  }, [setLocation]);

  useEffect(() => {
    request();
  }, [request]);

  return { status, retry: request };
}
