"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/store/themeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const html = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (theme === "dark") {
      html.classList.add("dark");
      meta?.setAttribute("content", "#0c0c0c");
    } else {
      html.classList.remove("dark");
      // Approximate hex for oklch(0.97 0.015 85) — the light bg token
      meta?.setAttribute("content", "#f5f0e6");
    }
  }, [theme]);

  return <>{children}</>;
}
