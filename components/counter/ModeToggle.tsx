"use client";
import { useSessionStore } from "@/lib/store/sessionStore";

export function ModeToggle() {
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);

  return (
    <button
      onClick={() => setMode(mode === "full" ? "shortened" : "full")}
      className="flex items-center justify-center h-10 px-3 text-xs font-sans tracking-wide uppercase text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      aria-label={`Switch to ${mode === "full" ? "shortened" : "full"} mode`}
    >
      {mode === "full" ? "Full" : "Short"}
    </button>
  );
}
