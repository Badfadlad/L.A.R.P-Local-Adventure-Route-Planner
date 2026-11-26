"use client";

import { ChevronDown, ChevronUp, Clock, GripVertical, Hourglass, Trash2, Wallet } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import PlaceImage from "@/components/places/PlaceImage";
import { formatCost, placeSubtitle } from "@/lib/places";
import { formatClock, formatDuration } from "@/lib/route";

/**
 * One stop in "Your itinerary". Reorder with the up/down buttons
 * (works with keyboard and screen readers) or by dragging on desktop.
 */
export default function StopCard({
  stop,
  index,
  total,
  schedule,
  onMove,
  onRemove,
  disabled,
  dragProps = {},
  dragging = false,
}) {
  const place = stop.place;
  return (
    <li className="flex gap-2 sm:gap-3" {...dragProps}>
      <span
        aria-hidden="true"
        className="mt-3 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
      >
        {index + 1}
      </span>
      <article
        aria-label={`Stop ${index + 1}: ${place.name}`}
        className={cn(
          "flex min-w-0 flex-1 gap-3 rounded-xl border border-border bg-card p-3 transition-shadow",
          dragging && "opacity-50 shadow-lg"
        )}
      >
        <PlaceImage place={place} className="h-20 w-16 sm:h-24 sm:w-20" />
        <div className="min-w-0 flex-1">
          <h3 className="font-heading leading-tight font-semibold">{place.name}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {placeSubtitle(place)}
            {place.neighborhood ? ` · ${place.neighborhood}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {schedule && (
              <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5">
                <Clock aria-hidden="true" className="size-3" />
                {formatClock(schedule.arrive)}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5">
              <Hourglass aria-hidden="true" className="size-3" />
              {formatDuration(schedule?.duration)}
            </span>
          </div>
          <p className={cn("mt-1.5 flex items-center gap-1 text-xs font-semibold", stop.cost ? "text-brand" : "text-success")}>
            <Wallet aria-hidden="true" className="size-3" />
            {formatCost(stop.cost)} <span className="font-normal text-muted-foreground">estimated</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center justify-between">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled || index === 0}
            onClick={() => onMove(index, index - 1)}
            aria-label={`Move ${place.name} earlier`}
          >
            <ChevronUp />
          </Button>
          <GripVertical aria-hidden="true" className="hidden size-4 cursor-grab text-muted-foreground md:block" />
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled || index === total - 1}
            onClick={() => onMove(index, index + 1)}
            aria-label={`Move ${place.name} later`}
          >
            <ChevronDown />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            onClick={() => onRemove(stop)}
            aria-label={`Remove ${place.name}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </article>
    </li>
  );
}
