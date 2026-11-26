"use client";

import { Bookmark, MapPin, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { placeSubtitle } from "@/lib/places";

/** Bookmarked place: name, type, area, with "Add to Trip" and remove. */
export default function BookmarkCard({ bookmark, onAddToTrip, onRemove, busy }) {
  const place = bookmark.place;
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand" aria-hidden="true">
        <Bookmark className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium">{place.name}</h3>
        <p className="truncate text-xs text-muted-foreground">{placeSubtitle(place)}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin aria-hidden="true" className="size-3" />
          {[place.neighborhood, place.city].filter(Boolean).join(", ")}
        </p>
      </div>
      {onAddToTrip && (
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => onAddToTrip(place)}
          className="bg-brand-soft text-brand"
          aria-label={`Add ${place.name} to your trip`}
        >
          <Plus aria-hidden="true" />
          <span className="hidden sm:inline">Add to Trip</span>
        </Button>
      )}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          onClick={() => onRemove(bookmark)}
          aria-label={`Remove bookmark for ${place.name}`}
          className="text-muted-foreground"
        >
          <X />
        </Button>
      )}
    </article>
  );
}
