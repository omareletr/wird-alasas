"use client";
import { useSessionStore } from "@/lib/store/sessionStore";

export function ModeToggle() {
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);

  return (
    <button
      onClick={() => setMode(mode === "full" ? "shortened" : "full")}
      className="text-[10px] font-mono tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors px-2 py-1"
      aria-label={`Switch to ${mode === "full" ? "shortened" : "full"} mode`}
    >
      {mode === "full" ? "Full" : "Short"}
    </button>
  );
}
