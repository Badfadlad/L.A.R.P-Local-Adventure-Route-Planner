"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Check, Clock, Compass, MapPin, Pencil, Plus, Save, Sparkles } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import MapPreview from "@/components/places/MapPreview";
import { getErrorMessage, placesApi, tripsApi } from "@/api/api";
import { withPlaceDetails } from "@/lib/places";
import { getActiveTripId, setActiveTripId } from "@/lib/activeTrip";
import { formatTripDate } from "@/lib/dates";
import {
  TRAVEL_MODES,
  buildBudget,
  buildSchedule,
  formatClock,
  formatDuration,
  moveItem,
  optimizeOrder,
  parseTime,
  routeTotals,
} from "@/lib/route";
import BudgetCard from "./BudgetCard";
import DaySchedule from "./DaySchedule";
import StopCard from "./StopCard";
import TravelDetails from "./TravelDetails";
import TravelModeTabs from "./TravelModeTabs";
import TripDetailsDialog from "./TripDetailsDialog";
import TripSummaryCard from "./TripSummaryCard";

export default function RouteBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = Number(searchParams.get("trip")) || null;

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [dialog, setDialog] = useState(null); // "details" | "save" | null
  const [dragIndex, setDragIndex] = useState(null);
  const [allPlaces, setAllPlaces] = useState([]); // for coordinates (see withPlaceDetails)

  useEffect(() => {
    placesApi
      .list({ limit: 100 })
      .then((res) => setAllPlaces(res.data))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    const id = requestedId ?? getActiveTripId();
    if (!id) {
      setTrip(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await tripsApi.get(id);
      setTrip(data);
      if (data.status === "planned") setActiveTripId(data.id);
    } catch (err) {
      if (!requestedId) setActiveTripId(null);
      setError(getErrorMessage(err, "Could not load your trip."));
    } finally {
      setLoading(false);
    }
  }, [requestedId]);

  useEffect(() => {
    // Wait a tick so the state updates happen in load()'s callbacks, not during the effect itself.
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const stops = useMemo(() => withPlaceDetails(trip?.stops ?? [], allPlaces), [trip, allPlaces]);
  const mode = trip?.transport_mode ?? "walking";
  const modeLabel = TRAVEL_MODES.find((m) => m.id === mode)?.label ?? "Walking";
  const places = stops.map((s) => s.place);
  const totals = useMemo(() => routeTotals(places, mode), [places, mode]);
  const schedule = useMemo(
    () => buildSchedule(stops, { startTime: trip?.start_time, mode }),
    [stops, trip?.start_time, mode]
  );
  const budget = useMemo(() => buildBudget(stops, { budget: trip?.budget, mode }), [stops, trip?.budget, mode]);
  const readOnly = trip?.status === "completed";

  /** Run an API change, then reload the trip. Shows errors in one place. */
  async function mutate(action, successText) {
    setSaving(true);
    setError("");
    try {
      await action();
      const { data } = await tripsApi.get(trip.id);
      setTrip(data);
      if (successText) setStatus(successText);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function reorder(newOrder, text) {
    // Show the new order right away, then save it.
    setTrip((t) => ({ ...t, stops: newOrder }));
    return mutate(() => tripsApi.reorderStops(trip.id, newOrder.map((s) => s.id)), text);
  }

  const onMove = (from, to) => reorder(moveItem(stops, from, to), `Moved ${stops[from].place.name}.`);
  const onRemove = (stop) =>
    mutate(() => tripsApi.removeStop(trip.id, stop.id), `Removed ${stop.place.name} from your trip.`);
  const onMode = (newMode) =>
    mutate(() => tripsApi.update(trip.id, { transport_mode: newMode }), `Travel mode set to ${newMode}.`);
  const onOptimize = () => {
    const better = optimizeOrder(stops);
    if (better.every((s, i) => s.id === stops[i].id)) {
      setStatus("Your route is already in the shortest order we can find.");
      return;
    }
    reorder(better, "Route optimized: stops reordered to cut travel time.");
  };

  async function saveDetails(changes, { finish = false } = {}) {
    try {
      const { data } = await tripsApi.update(trip.id, changes);
      setTrip(data);
      setDialog(null);
      if (finish) {
        setActiveTripId(null); // the next "Add Stop" starts a new trip
        router.push("/trips?saved=1");
      } else {
        setStatus("Trip details saved.");
      }
    } catch (err) {
      throw new Error(getErrorMessage(err, "Could not save the trip."));
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8 sm:px-6" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <MapPin aria-hidden="true" className="size-6" />
        </div>
        <h1 className="text-3xl font-semibold">Build your route</h1>
        <p className="text-muted-foreground">
          {error || "You haven't started a trip yet. Find a few places you like and tap \"Add Stop\"."}
        </p>
        <Link href="/discover" className={buttonVariants({ size: "lg" })}>
          <Compass aria-hidden="true" />
          Discover places
        </Link>
      </main>
    );
  }

  const finish = schedule.length ? schedule[schedule.length - 1].depart : null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 bg-background px-4 py-6 sm:px-6 md:py-10">
      {/* Title + trip details pills */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-brand">{trip.name}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {readOnly ? "Your completed route" : "Build your route"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Arrange your stops, choose how you travel, and keep track of your budget.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog("details")}
          disabled={readOnly}
          className="flex flex-wrap gap-2 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
          aria-label="Edit trip details"
        >
          <Pill icon={MapPin} label="Destination" value={trip.destination || "Not set"} />
          <Pill icon={CalendarDays} label="Trip date" value={formatTripDate(trip.trip_date, "short") || "Not set"} />
          <Pill
            icon={Clock}
            label="Start time"
            value={formatClock(parseTime(trip.start_time) ?? 9 * 60)}
            edit={!readOnly}
          />
        </button>
      </div>

      {/* Steps */}
      <ol className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-border bg-card px-4 py-3 text-sm">
        <Step n={1} label="Choose places" done />
        <Line />
        <Step n={2} label="Build route" current={!readOnly} done={readOnly} />
        <Line />
        <Step n={3} label="Review & save" done={readOnly} />
      </ol>

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,0.9fr)]">
        {/* 1. Itinerary */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle className="font-heading text-lg">Your itinerary</CardTitle>
              <CardDescription>{readOnly ? "Completed trip" : "Reorder your day with the arrows or drag"}</CardDescription>
            </div>
            {!readOnly && (
              <Link href="/discover" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "text-brand")}>
                <Plus aria-hidden="true" />
                Add stop
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {stops.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No stops yet. <Link href="/discover" className="font-medium text-brand">Discover places</Link> to add some.
              </p>
            ) : (
              <ol className="space-y-2">
                {stops.map((stop, i) => (
                  <div key={stop.id}>
                    {i > 0 && schedule[i].legBefore && (
                      <p className="my-1 ml-2.5 border-l-2 border-dashed border-border pl-5 text-xs text-muted-foreground">
                        {formatDuration(schedule[i].legBefore.minutes)} · {schedule[i].legBefore.miles} mi
                      </p>
                    )}
                    <StopCard
                      stop={stop}
                      index={i}
                      total={stops.length}
                      schedule={schedule[i]}
                      onMove={onMove}
                      onRemove={onRemove}
                      disabled={saving || readOnly}
                      dragging={dragIndex === i}
                      dragProps={
                        readOnly
                          ? {}
                          : {
                              draggable: true,
                              onDragStart: () => setDragIndex(i),
                              onDragOver: (e) => e.preventDefault(),
                              onDrop: () => {
                                if (dragIndex != null && dragIndex !== i) onMove(dragIndex, i);
                                setDragIndex(null);
                              },
                              onDragEnd: () => setDragIndex(null),
                            }
                      }
                    />
                  </div>
                ))}
              </ol>
            )}
            {!readOnly && stops.length > 2 && (
              <Button variant="secondary" className="w-full text-brand" onClick={onOptimize} disabled={saving}>
                <Sparkles aria-hidden="true" />
                Optimize my route
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 2. Route preview */}
        <Card className="lg:self-start">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Route preview</CardTitle>
            <CardDescription>Your day across {trip.destination || "town"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TravelModeTabs value={mode} onChange={onMode} disabled={saving || readOnly} />
            <div className="h-64 sm:h-80 lg:h-[26rem]">
              <MapPreview places={places} route />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-brand">
                <Clock aria-hidden="true" className="size-4" />
                {formatDuration(totals.minutes)} travel
              </span>
              <span className="font-semibold">{totals.miles} miles</span>
              {finish != null && <span className="text-muted-foreground">Finish around {formatClock(finish)}</span>}
            </div>
          </CardContent>
        </Card>

        {/* 3. Summary, budget, save */}
        <div className="flex flex-col gap-4">
          <TripSummaryCard
            dateLabel={formatTripDate(trip.trip_date)}
            stopCount={stops.length}
            minutes={totals.minutes}
            miles={totals.miles}
            finish={finish}
          />
          <BudgetCard budget={budget} modeLabel={modeLabel} onEditBudget={readOnly ? null : () => setDialog("details")} />
          {!readOnly && (
            <>
              <Button size="lg" className="h-11 text-base" onClick={() => setDialog("save")} disabled={stops.length === 0}>
                <Save aria-hidden="true" />
                Save this trip
              </Button>
              <Link href="/discover" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 text-base text-brand")}>
                <Compass aria-hidden="true" />
                Continue exploring
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <TravelDetails
          stops={stops}
          schedule={schedule}
          mode={mode}
          modeLabel={modeLabel}
          onModeChange={onMode}
          disabled={saving || readOnly}
        />
        {stops.length > 0 && <DaySchedule stops={stops} schedule={schedule} />}
      </div>

      <TripDetailsDialog
        open={dialog === "details"}
        onOpenChange={(open) => setDialog(open ? "details" : null)}
        trip={trip}
        onSave={(changes) => saveDetails(changes)}
      />
      <TripDetailsDialog
        open={dialog === "save"}
        onOpenChange={(open) => setDialog(open ? "save" : null)}
        trip={trip}
        title="Save this trip"
        submitLabel="Save trip"
        onSave={(changes) => saveDetails(changes, { finish: true })}
      />
    </main>
  );
}

function Pill({ icon: Icon, label, value, edit }) {
  return (
    <span className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
      <Icon aria-hidden="true" className="size-4 text-brand" />
      <span className="leading-tight">
        <span className="block text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase">{label}</span>
        <span className="text-sm font-semibold">{value}</span>
      </span>
      {edit && <Pencil aria-hidden="true" className="size-3.5 text-muted-foreground" />}
    </span>
  );
}

function Step({ n, label, done, current }) {
  return (
    <li className="flex shrink-0 items-center gap-2" aria-current={current ? "step" : undefined}>
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs font-bold",
          done ? "bg-success text-white" : current ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
        )}
      >
        {done ? <Check aria-hidden="true" className="size-3.5" /> : n}
      </span>
      <span className={cn("font-medium", !done && !current && "text-muted-foreground")}>{label}</span>
    </li>
  );
}

function Line() {
  return <li aria-hidden="true" className="h-px min-w-6 flex-1 bg-border" />;
}
