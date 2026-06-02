"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useThemeStore } from "@/lib/store/themeStore";

const THEME_COLORS = {
  dark: "#0c0c0c",
  light: "#f5f0e6",
} as const;

export function NativePolish() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.classList.add("capacitor-native");

    void SplashScreen.hide({ fadeOutDuration: 180 });

    return () => {
      document.documentElement.classList.remove("capacitor-native");
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backgroundColor = THEME_COLORS[theme];
    const style = theme === "dark" ? Style.Dark : Style.Light;

    void StatusBar.setOverlaysWebView({ overlay: true });
    void StatusBar.setStyle({ style });
    void StatusBar.setBackgroundColor({ color: backgroundColor });
  }, [theme]);

  return null;
}
