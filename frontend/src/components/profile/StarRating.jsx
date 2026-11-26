"use client";

import { Star } from "lucide-react";
import { cn } from "cn";

/**
 * 1-5 star picker. It's a radio group, so it works with the keyboard
 * (Tab to it, arrow keys to change) and screen readers read "4 stars, selected".
 * Pass `readOnly` to just display a rating.
 */
export default function StarRating({ value = 0, onChange, readOnly = false, size = "md", label = "Rating" }) {
  const px = size === "sm" ? "size-4" : "size-8";

  if (readOnly) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden="true"
            className={cn(px, n <= value ? "fill-primary text-primary" : "text-muted-foreground/40")}
          />
        ))}
      </span>
    );
  }

  function onKeyDown(e) {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(1, (value || 1) - 1));
    }
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1" onKeyDown={onKeyDown}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
          tabIndex={value === n || (!value && n === 1) ? 0 : -1}
          onClick={() => onChange(n)}
          className="rounded-md p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Star
            aria-hidden="true"
            className={cn(px, "transition-colors", n <= value ? "fill-primary text-primary" : "text-muted-foreground/50")}
          />
        </button>
      ))}
    </div>
  );
}
