"use client";

import { cn } from "cn";
import { FILTER_CHIPS } from "@/lib/places";

/** Pill-shaped filter toggles (Food, Parks, Under $25...). */
export default function FilterChips({ active = [], onToggle, chips = FILTER_CHIPS }) {
  return (
    <div role="group" aria-label="Filters" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {chips.map((chip) => {
        const on = active.includes(chip.id);
        const price = chip.variant === "price";
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(chip.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              price
                ? on
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-orange-400 text-orange-700 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-950"
                : on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-primary/40 text-brand hover:bg-brand-soft"
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
