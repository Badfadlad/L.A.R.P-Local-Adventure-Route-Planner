"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage, tripsApi } from "@/api/api";
import { getActiveTripId, setActiveTripId } from "@/lib/activeTrip";
import TripCard from "./TripCard";

/** "My Trips": planned trips and travel history (completed trips). */
export default function TripsView() {
  const searchParams = useSearchParams();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(searchParams.get("saved") ? "Trip saved! You can find it here any time." : "");
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await tripsApi.list();
      setTrips(data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your trips."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait a tick so the state updates happen in load()'s callbacks, not during the effect itself.
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function complete(trip) {
    setBusyId(trip.id);
    try {
      await tripsApi.complete(trip.id);
      if (getActiveTripId() === trip.id) setActiveTripId(null);
      setStatus(`"${trip.name}" is completed. You can now review the places you visited on your Profile.`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    const trip = toDelete;
    setToDelete(null);
    setBusyId(trip.id);
    try {
      await tripsApi.remove(trip.id);
      if (getActiveTripId() === trip.id) setActiveTripId(null);
      setStatus(`Deleted "${trip.name}".`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const planned = trips.filter((t) => t.status === "planned");
  const completed = trips.filter((t) => t.status === "completed");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">My Trips</h1>
          <p className="mt-1 text-muted-foreground">Plans in progress and adventures you&apos;ve finished.</p>
        </div>
        <Link href="/discover" className={buttonVariants({ size: "lg" })}>
          <Plus aria-hidden="true" />
          New trip
        </Link>
      </div>

      <p role="status" aria-live="polite" className={status ? "rounded-xl bg-brand-soft p-3 text-sm text-brand" : "sr-only"}>
        {status}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : (
        <>
          <TripSection title="Planned" trips={planned} empty="No planned trips. Start one from Discover!">
            {(trip) => (
              <TripCard key={trip.id} trip={trip} onComplete={complete} onDelete={setToDelete} busy={busyId === trip.id} />
            )}
          </TripSection>
          <TripSection title="Travel history" trips={completed} empty="Completed trips show up here.">
            {(trip) => <TripCard key={trip.id} trip={trip} onDelete={setToDelete} busy={busyId === trip.id} />}
          </TripSection>
        </>
      )}

      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogTitle>Delete this trip?</DialogTitle>
          <DialogDescription>
            &quot;{toDelete?.name}&quot; and its stops will be deleted. This can&apos;t be undone.
          </DialogDescription>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete trip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function TripSection({ title, trips, empty, children }) {
  return (
    <section aria-label={title} className="space-y-3">
      <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{title}</h2>
      {trips.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">{trips.map(children)}</div>
      )}
    </section>
  );
}
