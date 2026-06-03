"use client";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import { ResetTimePicker } from "@/components/ui/reset-time-picker";
import type { FeedbackMode } from "@/lib/storage/schema";

export function SettingsSheet() {
  const [isNative, setIsNative] = useState(false);
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);
  const resetHour = useSettingsStore((s) => s.resetHour);
  const setResetHour = useSettingsStore((s) => s.setResetHour);
  const feedbackMode = useSettingsStore((s) => s.feedbackMode);
  const setFeedbackMode = useSettingsStore((s) => s.setFeedbackMode);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    if (isNative && (feedbackMode === "audio" || feedbackMode === "both")) {
      setFeedbackMode("haptic");
    }
  }, [feedbackMode, isNative, setFeedbackMode]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-muted-foreground active:bg-muted/60"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[86vh] border-t border-border bg-card"
      >
        <SheetHeader>
          <SheetTitle className="text-[11px] font-sans tracking-[0.2em] uppercase text-muted-foreground text-left">
            Settings
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-7 space-y-5 [-webkit-overflow-scrolling:touch]">
          {/* Mode section */}
          <div>
            <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/70 mb-4">
              Mode
            </p>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as "full" | "shortened")}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="full" id="mode-full" />
                <Label
                  htmlFor="mode-full"
                  className="text-sm font-sans text-foreground cursor-pointer"
                >
                  Full (200 · 200 · 100 · 100)
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="shortened" id="mode-shortened" />
                <Label
                  htmlFor="mode-shortened"
                  className="text-sm font-sans text-foreground cursor-pointer"
                >
                  Short (20 · 20 · 10 · 10)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <hr className="border-border" />

          {/* Feedback section */}
          <div>
            <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/70 mb-4">
              Feedback
            </p>
            <RadioGroup
              value={feedbackMode}
              onValueChange={(v) => setFeedbackMode(v as FeedbackMode)}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="off" id="feedback-off" />
                <Label
                  htmlFor="feedback-off"
                  className="text-sm font-sans text-foreground cursor-pointer"
                >
                  Off
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="haptic" id="feedback-haptic" />
                <Label
                  htmlFor="feedback-haptic"
                  className="text-sm font-sans text-foreground cursor-pointer"
                >
                  Haptic
                </Label>
              </div>
              {!isNative && (
                <>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="audio" id="feedback-audio" />
                    <Label
                      htmlFor="feedback-audio"
                      className="text-sm font-sans text-foreground cursor-pointer"
                    >
                      Audio
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="both" id="feedback-both" />
                    <Label
                      htmlFor="feedback-both"
                      className="text-sm font-sans text-foreground cursor-pointer"
                    >
                      Both
                    </Label>
                  </div>
                </>
              )}
            </RadioGroup>
            {isNative && (
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/70">
                On iPhone, feedback uses haptics only for now.
              </p>
            )}
          </div>

          <hr className="border-border" />

          {/* Reset time section */}
          <div>
            <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/70 mb-4">
              Daily reset time
            </p>
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground/70">
              Your counts roll into history at this time each day.
            </p>
            <ResetTimePicker value={resetHour} onChange={setResetHour} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
