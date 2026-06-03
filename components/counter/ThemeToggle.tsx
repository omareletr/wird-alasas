"use client";

import { useRef, useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore } from "@/lib/store/themeStore";

const THEME_BG = { dark: "#0c0c0c", light: "#f5f0e6" } as const;

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  // Track icon separately so it flips immediately on tap, not after animation.
  const [iconTheme, setIconTheme] = useState<"dark" | "light">(theme);
  const transitioning = useRef(false);

  // Stay in sync with external theme changes (e.g. initial store hydration).
  useEffect(() => { setIconTheme(theme); }, [theme]);

  const handleToggle = () => {
    if (transitioning.current) return;
    transitioning.current = true;

    const newTheme = theme === "dark" ? "light" : "dark";
    setIconTheme(newTheme);

    // iOS reads <html> background-color directly (not composited pixels) for
    // status bar icon adaptation. Overlays at any z-index are invisible to it.
    // The only moment to flip the class without a visible status bar snap is
    // while a same-color full-screen cover is at full opacity — the status bar
    // updates to match the new HTML background, but the screen already shows
    // that same color, so the icon change is undetectable.
    const overlay = document.createElement("div");
    overlay.style.cssText = `position:fixed;inset:0;z-index:9999;background:${THEME_BG[newTheme]};pointer-events:none;opacity:0;`;
    document.body.appendChild(overlay);

    overlay.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 100, fill: "forwards" }
    ).finished.then(() => {
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_BG[newTheme]);
      toggleTheme();
      // Two rAFs: first lets React flush, second lets the browser paint the
      // new theme so the status bar has updated before the overlay lifts.
      return new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
    }).then(() =>
      overlay.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 200, easing: "ease-out", fill: "forwards" }
      ).finished
    ).then(() => {
      overlay.remove();
      transitioning.current = false;
    });
  };

  return (
    <button
      onClick={handleToggle}
      className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground active:bg-muted/60"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={iconTheme}
          initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{ display: "flex" }}
        >
          {iconTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
