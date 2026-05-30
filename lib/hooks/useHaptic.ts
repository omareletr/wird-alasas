/** Returns a vibrate(ms) function. Silently no-ops on iOS (no Vibration API support). */
export function useHaptic() {
  function vibrate(ms = 10) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  }
  return vibrate;
}
