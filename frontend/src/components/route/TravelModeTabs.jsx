"use client";

import { Bike, Bus, Car, Footprints } from "lucide-react";
import { cn } from "cn";
import { TRAVEL_MODES } from "@/lib/route";

const ICONS = { walking: Footprints, driving: Car, biking: Bike, transit: Bus };

/** Walking / Driving / Biking / Transit switch. Uses radio semantics for screen readers. */
export default function TravelModeTabs({ value, onChange, disabled = false, size = "sm" }) {
  return (
    <div
      role="radiogroup"
      aria-label="How you'll get around"
      className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-muted/50 p-1"
    >
      {TRAVEL_MODES.map((mode) => {
        const Icon = ICONS[mode.id];
        const selected = value === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(mode.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
              size === "lg" ? "h-12 text-sm" : "h-9 text-xs sm:text-sm",
              selected ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background"
            )}
          >
            <Icon aria-hidden="true" className="hidden size-4 min-[400px]:block" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
