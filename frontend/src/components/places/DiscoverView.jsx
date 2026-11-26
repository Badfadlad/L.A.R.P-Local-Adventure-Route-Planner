"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { bookmarksApi, getErrorMessage, placesApi, tripsApi } from "@/api/api";
import { useAuth } from "@/context/AuthContext";
import { addPlaceToActiveTrip, getActiveTripId } from "@/lib/activeTrip";
import { FILTER_CHIPS, chipsToParams, toggleChip } from "@/lib/places";
import { sanitizeSearch } from "@/lib/validation";
import FilterChips from "./FilterChips";
import MapPreview from "./MapPreview";
import PlaceCard from "./PlaceCard";

const VALID_CHIPS = new Set(FILTER_CHIPS.map((c) => c.id));

export default function DiscoverView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Start from the URL, e.g. /discover?chips=park,under25&q=garden (from the homepage).
  const [chips, setChips] = useState(() =>
    (searchParams.get("chips") ?? "")
      .split(",")
      .filter((id) => VALID_CHIPS.has(id))
  );
  const [queryInput, setQueryInput] = useState(() => sanitizeSearch(searchParams.get("q")));
  const [query, setQuery] = useState(queryInput);

  // Results are tagged with the filters they were loaded for, so "loading"
  // is simply "the results we have are for different filters".
  const [results, setResults] = useState({ key: null, places: [], error: "" });
  const [status, setStatus] = useState(null); // { text, tripLink? }

  const [bookmarks, setBookmarks] = useState({}); // placeId -> bookmarkId
  const [addedIds, setAddedIds] = useState(new Set()); // places already in the active trip
  const [busyId, setBusyId] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  const params = useMemo(() => ({ ...chipsToParams(chips), ...(query ? { q: query } : {}), limit: 50 }), [chips, query]);
  const requestKey = JSON.stringify(params);
  const loading = results.key !== requestKey;
  const { places, error } = loading ? { places: [], error: "" } : results;

  // Load places whenever the filters or the search change.
  useEffect(() => {
    let cancelled = false;
    placesApi
      .list(params)
      .then((res) => !cancelled && setResults({ key: requestKey, places: res.data, error: "" }))
      .catch(
        (err) =>
          !cancelled && setResults({ key: requestKey, places: [], error: getErrorMessage(err, "Unable to load places.") })
      );
    return () => {
      cancelled = true;
    };
  }, [params, requestKey]);

  // Logged in: which places are bookmarked / already in the trip being planned.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await bookmarksApi.list();
        if (!cancelled) setBookmarks(Object.fromEntries(data.map((b) => [b.place_id, b.id])));
      } catch {
        /* bookmarks are optional on this page */
      }
      const tripId = getActiveTripId();
      if (!tripId) return;
      try {
        const { data } = await tripsApi.get(tripId);
        if (!cancelled && data.status === "planned") setAddedIds(new Set(data.stops.map((s) => s.place.id)));
      } catch {
        /* the trip may have been deleted */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  function onSearch(e) {
    e.preventDefault();
    const clean = sanitizeSearch(queryInput);
    setQueryInput(clean);
    setQuery(clean);
  }

  async function onAdd(place) {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setBusyId(place.id);
    try {
      await addPlaceToActiveTrip(place);
      setAddedIds((prev) => new Set(prev).add(place.id));
      setStatus({ text: `${place.name} was added to your trip.`, tripLink: true });
    } catch (err) {
      setStatus({ text: getErrorMessage(err, "Could not add that stop.") });
    } finally {
      setBusyId(null);
    }
  }

  async function onToggleBookmark(place) {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const existing = bookmarks[place.id];
    try {
      if (existing) {
        await bookmarksApi.remove(existing);
        setBookmarks(({ [place.id]: _removed, ...rest }) => rest);
        setStatus({ text: `Removed ${place.name} from your bookmarks.` });
      } else {
        const { data } = await bookmarksApi.create(place.id);
        setBookmarks((prev) => ({ ...prev, [place.id]: data.id }));
        setStatus({ text: `Bookmarked ${place.name}.` });
      }
    } catch (err) {
      setStatus({ text: getErrorMessage(err, "Could not update your bookmark.") });
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 md:py-10">
      {/* Banner (desktop) / title (mobile) */}
      <section className="relative overflow-hidden rounded-3xl bg-orange-50 px-6 py-8 sm:px-10 sm:py-12 dark:bg-orange-950/40">
        <div aria-hidden="true" className="absolute -top-16 -right-16 size-64 rounded-full bg-orange-100 dark:bg-orange-900/40" />
        <h1 className="relative text-3xl font-bold tracking-tight sm:text-5xl">Find the next great stop.</h1>
        <p className="relative mt-3 max-w-xl text-orange-900/80 dark:text-orange-100/80">
          Discover hidden local spots, build a custom route and find roadside gems around San Diego.
        </p>
      </section>

      <form role="search" onSubmit={onSearch} className="flex gap-2 sm:gap-3">
        <label htmlFor="place-search" className="sr-only">
          Search places
        </label>
        <div className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="place-search"
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            maxLength={100}
            placeholder="Search San Diego"
            className="h-11 rounded-xl border-brand/50 pl-9 text-base"
          />
        </div>
        <Button type="submit" size="lg" className="h-11 rounded-xl px-5 sm:px-8">
          Search
        </Button>
      </form>

      <FilterChips active={chips} onToggle={(id) => setChips((prev) => toggleChip(prev, id))} />

      <p role="status" aria-live="polite" className={status ? "text-sm" : "sr-only"}>
        {status && (
          <span className="inline-flex flex-wrap items-center gap-2">
            {status.text}
            {status.tripLink && (
              <Link href="/plan" className="inline-flex items-center gap-1 font-medium text-brand underline-offset-4 hover:underline">
                View your route <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            )}
          </span>
        )}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        {/* Map: a strip on top on mobile, a sticky panel on the right on desktop */}
        <div className="h-44 sm:h-64 lg:sticky lg:top-24 lg:order-2 lg:h-[32rem]">
          <MapPreview places={places} highlightId={hoverId} />
        </div>

        <section aria-labelledby="results-title" className="flex flex-col gap-3 lg:order-1">
          <h2 id="results-title" className="text-xl font-semibold">
            {query || chips.length ? `${loading ? "" : places.length} places found` : "Places you might like"}
          </h2>

          {loading &&
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}

          {!loading && error && (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </p>
          )}

          {!loading && !error && places.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <p>No places match those filters.</p>
              <Button
                variant="link"
                onClick={() => {
                  setChips([]);
                  setQuery("");
                  setQueryInput("");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {!loading &&
            places.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onAdd={onAdd}
                onToggleBookmark={onToggleBookmark}
                bookmarked={!!bookmarks[place.id]}
                added={addedIds.has(place.id)}
                busy={busyId === place.id}
                highlighted={hoverId === place.id}
                onHover={setHoverId}
              />
            ))}

          {!authLoading && !isAuthenticated && (
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className={buttonVariants({ variant: "link" }) + " px-0"}>
                Log in
              </Link>{" "}
              to add stops and bookmark places.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
