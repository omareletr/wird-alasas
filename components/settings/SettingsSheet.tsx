"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { useSettingsStore } from "@/lib/store/settingsStore";

export function SettingsSheet() {
  const defaultMode = useSettingsStore((s) => s.defaultMode);
  const setDefaultMode = useSettingsStore((s) => s.setDefaultMode);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="p-2 text-white/30 hover:text-white/60 transition-colors"
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="bg-black border-t border-white/10">
        <SheetHeader>
          <SheetTitle className="text-white text-left">Settings</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm text-white/60 mb-3">Default mode</p>
            <RadioGroup
              value={defaultMode}
              onValueChange={(v) => setDefaultMode(v as "full" | "shortened")}
              className="space-y-2"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="full" id="mode-full" />
                <Label htmlFor="mode-full" className="text-white cursor-pointer">
                  Full (200 · 200 · 100 · 100)
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="shortened" id="mode-shortened" />
                <Label htmlFor="mode-shortened" className="text-white cursor-pointer">
                  Shortened (20 · 20 · 10 · 10)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
