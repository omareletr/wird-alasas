"use client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import { TIME_OPTIONS } from "@/lib/utils/timeOptions";

export function SettingsSheet() {
  const mode = useSessionStore((s) => s.mode);
  const setMode = useSessionStore((s) => s.setMode);
  const resetHour = useSettingsStore((s) => s.resetHour);
  const setResetHour = useSettingsStore((s) => s.setResetHour);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex items-center justify-center h-10 w-10 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="bg-card border-t border-border max-h-[85vh]"
      >
        <SheetHeader>
          <SheetTitle className="text-[11px] font-sans tracking-[0.2em] uppercase text-muted-foreground text-left">
            Settings
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-4">
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

          {/* Reset time section */}
          <div>
            <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground/70 mb-4">
              Daily reset time
            </p>
            <Select
              value={String(resetHour)}
              onValueChange={(v) => setResetHour(Number(v))}
            >
              <SelectTrigger className="w-full font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)} className="font-sans text-sm">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
