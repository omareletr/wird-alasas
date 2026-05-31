"use client";

import { useRef } from "react";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore } from "@/lib/store/themeStore";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const transitioning = useRef(false);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (transitioning.current) return;

    const { clientX: x, clientY: y } = e;
    const newTheme = theme === "dark" ? "light" : "dark";

    if (!document.startViewTransition) {
      toggleTheme();
      return;
    }

    document.documentElement.style.setProperty("--vt-x", `${x}px`);
    document.documentElement.style.setProperty("--vt-y", `${y}px`);

    transitioning.current = true;
    const vt = document.startViewTransition(() => {
      // Apply class synchronously so browser captures correct new colors
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      // Keep store in sync (ThemeProvider effect will be a no-op)
      toggleTheme();
    });
    vt.finished.finally(() => {
      transitioning.current = false;
    });
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center justify-center h-10 w-10 text-muted-foreground hover:text-foreground transition-colors"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{ display: "flex" }}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
