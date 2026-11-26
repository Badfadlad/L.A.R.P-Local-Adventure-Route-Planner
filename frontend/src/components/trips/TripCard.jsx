"use client";

import Link from "next/link";
import { ArrowRight, CircleCheck, MapPin, Route, Trash2, Wallet } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatTripDate } from "@/lib/dates";

/** Saved trip card: "San Diego Saturday · Oct 17 · 4 Stops · $60 Estimated". */
export default function TripCard({ trip, onComplete, onDelete, busy = false, compact = false }) {
  const completed = trip.status === "completed";
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-lg font-semibold">{trip.name}</h3>
          <p className="text-sm text-muted-foreground">
            {trip.trip_date ? formatTripDate(trip.trip_date, "short") : "No date yet"}
            {trip.destination ? ` · ${trip.destination}` : ""}
          </p>
        </div>
        {completed ? (
          <Badge variant="success">
            <CircleCheck aria-hidden="true" />
            Completed
          </Badge>
        ) : (
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand" aria-hidden="true">
            <Route className="size-4" />
          </span>
        )}
      </div>

      <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin aria-hidden="true" className="size-4" />
          <dt className="sr-only">Stops</dt>
          <dd>
            {trip.stop_count} {trip.stop_count === 1 ? "Stop" : "Stops"}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Wallet aria-hidden="true" className="size-4" />
          <dt className="sr-only">Estimated cost</dt>
          <dd>${Number(trip.estimated_total).toFixed(0)} Estimated</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/plan?trip=${trip.id}`}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "bg-brand-soft text-brand")}
          aria-label={`Open trip ${trip.name}`}
        >
          Open Trip <ArrowRight aria-hidden="true" />
        </Link>
        {!compact && !completed && onComplete && (
          <Button variant="outline" size="sm" disabled={busy || trip.stop_count === 0} onClick={() => onComplete(trip)}>
            <CircleCheck aria-hidden="true" />
            Mark completed
          </Button>
        )}
        {!compact && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onDelete(trip)}
            className="ml-auto text-muted-foreground hover:text-destructive"
            aria-label={`Delete trip ${trip.name}`}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        )}
      </div>
    </article>
  );
}
