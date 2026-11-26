"use client";

import { Bookmark, BookmarkCheck, Check, Plus, Star } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { formatCost, placeSubtitle } from "@/lib/places";
import PlaceImage from "./PlaceImage";

/**
 * One row in "Places you might like" (Discover page).
 * Desktop: "+ Add Stop" text button. Mobile: compact "+ Add" button.
 */
export default function PlaceCard({
  place,
  onAdd,
  onToggleBookmark,
  bookmarked = false,
  added = false,
  busy = false,
  highlighted = false,
  onHover,
}) {
  return (
    <article
      onMouseEnter={() => onHover?.(place.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 transition-shadow sm:gap-4",
        highlighted ? "border-brand shadow-md" : "border-border hover:shadow-sm"
      )}
    >
      <PlaceImage place={place} className="size-16 sm:size-20" />

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-heading text-base font-semibold">{place.name}</h3>
        <p className="truncate text-sm text-muted-foreground">
          {placeSubtitle(place)}
          {place.neighborhood ? ` · ${place.neighborhood}` : ""}
        </p>
        <p className="mt-1 flex items-center gap-3 text-sm">
          <span className={cn("font-semibold", place.estimated_cost ? "text-foreground" : "text-success")}>
            {formatCost(place.estimated_cost)}
          </span>
          {place.average_rating != null && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Star aria-hidden="true" className="size-3.5 fill-amber-400 text-amber-400" />
              {place.average_rating.toFixed(1)}
              <span className="sr-only"> out of 5 from {place.review_count} reviews</span>
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
        {onToggleBookmark && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleBookmark(place)}
            aria-pressed={bookmarked}
            aria-label={bookmarked ? `Remove ${place.name} from bookmarks` : `Bookmark ${place.name}`}
          >
            {bookmarked ? <BookmarkCheck className="text-brand" /> : <Bookmark />}
          </Button>
        )}
        {onAdd && (
          <Button
            variant={added ? "secondary" : "outline"}
            size="sm"
            disabled={busy || added}
            onClick={() => onAdd(place)}
            className="border-brand/40 text-brand"
            aria-label={added ? `${place.name} is in your trip` : `Add ${place.name} as a stop`}
          >
            {added ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
            <span className="sm:hidden">{added ? "Added" : "Add"}</span>
            <span className="hidden sm:inline">{added ? "Added" : "Add Stop"}</span>
          </Button>
        )}
      </div>
    </article>
  );
}
