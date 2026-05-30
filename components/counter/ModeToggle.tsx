"use client";
import { useSessionStore } from "@/lib/store/sessionStore";

export function ModeToggle() {
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);

  return (
    <button
      onClick={() => setMode(mode === "full" ? "shortened" : "full")}
      className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded"
      aria-label={`Switch to ${mode === "full" ? "shortened" : "full"} mode`}
    >
      {mode === "full" ? "Full" : "Short"}
    </button>
  );
}
