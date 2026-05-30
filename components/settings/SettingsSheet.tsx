"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useGeolocation } from "@/lib/hooks/useGeolocation";

function geoStatusMessage(status: ReturnType<typeof useGeolocation>["status"]): string {
  switch (status) {
    case "loading": return "Detecting location…";
    case "success": return "Location detected";
    case "denied": return "Location access denied. Enter coordinates manually.";
    case "unavailable":
    case "timeout": return "Location unavailable. Enter coordinates manually.";
    case "unsupported": return "Geolocation not supported. Enter coordinates manually.";
    default: return "";
  }
}

function geoStatusColor(status: ReturnType<typeof useGeolocation>["status"]): string {
  switch (status) {
    case "loading": return "text-white/30";
    case "success": return "text-white/50";
    default: return "text-white/30";
  }
}

export function SettingsSheet() {
  const defaultMode = useSettingsStore((s) => s.defaultMode);
  const setDefaultMode = useSettingsStore((s) => s.setDefaultMode);
  const location = useSettingsStore((s) => s.location);
  const setLocation = useSettingsStore((s) => s.setLocation);

  const { status, retry } = useGeolocation();

  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [validationError, setValidationError] = useState(false);

  const showManualForm =
    location === null ||
    status === "denied" ||
    status === "unavailable" ||
    status === "timeout" ||
    status === "unsupported";

  function handleSave() {
    const latVal = parseFloat(lat);
    const lonVal = parseFloat(lon);
    if (
      isNaN(latVal) || isNaN(lonVal) ||
      latVal < -90 || latVal > 90 ||
      lonVal < -180 || lonVal > 180
    ) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    setLocation({ latitude: latVal, longitude: lonVal });
  }

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
      <SheetContent side="bottom" className="bg-card border-t border-border">
        <SheetHeader>
          <SheetTitle className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/50 text-left">
            Settings
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {/* Mode section */}
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/30 mb-4">
              Default mode
            </p>
            <RadioGroup
              value={defaultMode}
              onValueChange={(v) => setDefaultMode(v as "full" | "shortened")}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="full" id="mode-full" />
                <Label htmlFor="mode-full" className="text-sm font-mono text-white cursor-pointer">
                  Full — 200 · 200 · 100 · 100
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="shortened" id="mode-shortened" />
                <Label htmlFor="mode-shortened" className="text-sm font-mono text-white cursor-pointer">
                  Short — 20 · 20 · 10 · 10
                </Label>
              </div>
            </RadioGroup>
          </div>

          <hr className="border-white/10" />

          {/* Location section */}
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/30 mb-4">
              Location
            </p>

            {/* Status line */}
            {status !== "idle" && (
              <p className={`text-[10px] font-mono mb-3 ${geoStatusColor(status)}`}>
                {geoStatusMessage(status)}
              </p>
            )}

            {/* Current coords display */}
            {location !== null && (
              <p className="text-[10px] font-mono text-white/50 mb-3 tabular-nums">
                lat: {location.latitude.toFixed(4)}&nbsp;&nbsp;lon: {location.longitude.toFixed(4)}
              </p>
            )}

            {/* Manual entry form */}
            {showManualForm && (
              <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="lat-input" className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1 block">
                      Latitude
                    </Label>
                    <Input
                      id="lat-input"
                      type="number"
                      step="0.0001"
                      min="-90"
                      max="90"
                      placeholder="21.4225"
                      value={lat}
                      onChange={(e) => { setLat(e.target.value); setValidationError(false); }}
                      className="text-sm font-mono bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="lon-input" className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1 block">
                      Longitude
                    </Label>
                    <Input
                      id="lon-input"
                      type="number"
                      step="0.0001"
                      min="-180"
                      max="180"
                      placeholder="39.8262"
                      value={lon}
                      onChange={(e) => { setLon(e.target.value); setValidationError(false); }}
                      className="text-sm font-mono bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                  </div>
                </div>
                {validationError && (
                  <p className="text-[10px] font-mono text-red-400">Invalid coordinates</p>
                )}
                <button
                  onClick={handleSave}
                  className="text-[10px] font-mono tracking-widest uppercase text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Save
                </button>
              </div>
            )}

            {/* Use my location button */}
            <button
              onClick={retry}
              className="text-[10px] font-mono tracking-widest uppercase text-white/30 hover:text-white/60 transition-colors"
            >
              Use my location
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
