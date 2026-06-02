"use client";

import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { useSettingsStore } from "@/lib/store/settingsStore";

type BrowserWindowWithAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

function vibrate(pattern: VibratePattern) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function isNativeRuntime() {
  return Capacitor.isNativePlatform();
}

async function playNativeTapHaptic() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    vibrate(10);
  }
}

async function playNativeMilestoneHaptic() {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      vibrate([20, 35, 35]);
    }
  }
}

function playSoftChime() {
  if (typeof window === "undefined") return;

  const AudioContextClass =
    window.AudioContext ||
    (window as BrowserWindowWithAudio).webkitAudioContext;

  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(660, now);
  oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.12);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.2);
  oscillator.onended = () => {
    void context.close();
  };
}

export function useFeedback() {
  const feedbackMode = useSettingsStore((s) => s.feedbackMode);

  const playTapFeedback = useCallback(() => {
    if (feedbackMode === "haptic" || feedbackMode === "both") {
      if (isNativeRuntime()) {
        void playNativeTapHaptic();
        return;
      }

      vibrate(10);
    }
  }, [feedbackMode]);

  const playMilestoneFeedback = useCallback(() => {
    if (feedbackMode === "haptic" || feedbackMode === "both") {
      if (isNativeRuntime()) {
        void playNativeMilestoneHaptic();
      } else {
        vibrate([20, 35, 35]);
      }
    }

    if (!isNativeRuntime() && (feedbackMode === "audio" || feedbackMode === "both")) {
      playSoftChime();
    }
  }, [feedbackMode]);

  return { playTapFeedback, playMilestoneFeedback };
}
