"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bookmarksApi, getErrorMessage, reviewsApi, tripsApi, usersApi } from "@/api/api";
import { addPlaceToActiveTrip } from "@/lib/activeTrip";
import { formatTripDate } from "@/lib/dates";
import { placeSubtitle } from "@/lib/places";
import TripCard from "@/components/trips/TripCard";
import BookmarkCard from "./BookmarkCard";
import EditProfileDialog from "./EditProfileDialog";
import ReviewForm from "./ReviewForm";
import StarRating from "./StarRating";

const TABS = ["trips", "bookmarks", "reviews"];

/** Profile page from the Figma design: header, saved trips, bookmarks, reviews. */
export default function ProfileView() {
  const searchParams = useSearchParams();
  const initialTab = TABS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "trips";

  const [profile, setProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [visited, setVisited] = useState([]); // [{ place, tripId }] from completed trips
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [skipped, setSkipped] = useState([]); // place ids skipped this visit

  const load = useCallback(async () => {
    try {
      const [me, tripsRes, bookmarksRes, reviewsRes] = await Promise.all([
        usersApi.profile(),
        tripsApi.list(),
        bookmarksApi.list(),
        reviewsApi.mine(),
      ]);
      setProfile(me.data);
      setTrips(tripsRes.data);
      setBookmarks(bookmarksRes.data);
      setReviews(reviewsRes.data);

      // Places from completed trips can be reviewed ("Review Your Visit").
      const completed = tripsRes.data.filter((t) => t.status === "completed");
      const details = await Promise.all(completed.map((t) => tripsApi.get(t.id).then((r) => r.data)));
      const seen = new Map();
      for (const trip of details) {
        for (const stop of trip.stops) {
          if (!seen.has(stop.place.id)) seen.set(stop.place.id, { place: stop.place, tripId: trip.id });
        }
      }
      setVisited([...seen.values()]);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load your profile."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait a tick so the state updates happen in load()'s callbacks, not during the effect itself.
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const toReview = useMemo(() => {
    const reviewed = new Set(reviews.map((r) => r.place_id));
    return visited.filter((v) => !reviewed.has(v.place.id) && !skipped.includes(v.place.id));
  }, [visited, reviews, skipped]);

  async function saveProfile(changes) {
    try {
      await usersApi.updateProfile(changes);
      const { data } = await usersApi.profile();
      setProfile(data);
      setEditing(false);
      setStatus("Profile updated.");
    } catch (err) {
      throw new Error(getErrorMessage(err, "Could not save your profile."));
    }
  }

  async function addToTrip(place) {
    setBusyId(place.id);
    try {
      await addPlaceToActiveTrip(place);
      setStatus(`${place.name} was added to your trip.`);
    } catch (err) {
      setStatus(getErrorMessage(err, "Could not add that place."));
    } finally {
      setBusyId(null);
    }
  }

  async function removeBookmark(bookmark) {
    setBusyId(bookmark.place.id);
    try {
      await bookmarksApi.remove(bookmark.id);
      setBookmarks((list) => list.filter((b) => b.id !== bookmark.id));
      setProfile((p) => ({ ...p, bookmark_count: Math.max(0, p.bookmark_count - 1) }));
      setStatus(`Removed ${bookmark.place.name} from your bookmarks.`);
    } catch (err) {
      setStatus(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function submitReview(item, { rating, comment }) {
    try {
      const { data } = await reviewsApi.create({ place_id: item.place.id, trip_id: item.tripId, rating, comment });
      setReviews((list) => [data, ...list]);
      setProfile((p) => ({ ...p, review_count: p.review_count + 1 }));
      setStatus(`Thanks! Your review of ${item.place.name} was posted.`);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Could not post your review."));
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10" aria-busy="true">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <p role="alert" className="text-destructive">
          {error || "Profile not found."}
        </p>
      </main>
    );
  }

  const name = profile.display_name || profile.username;
  const current = toReview[0];

  return (
    <main className="flex flex-1 flex-col">
      {/* --- Your Adventure Profile --- */}
      <section className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 md:py-12">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Your Adventure Profile</h1>
          <p className="mt-2 text-muted-foreground">Keep track of your trips, saved places, and reviews.</p>
        </div>

        <p role="status" aria-live="polite" className={status ? "rounded-xl bg-brand-soft p-3 text-sm text-brand" : "sr-only"}>
          {status}
        </p>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:p-6">
          <div
            aria-hidden="true"
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-heading text-2xl font-bold text-emerald-700 sm:size-20"
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold">{name}</h2>
            <p className="text-sm text-muted-foreground">
              @{profile.username}
              {profile.home_city ? ` · ${profile.home_city}` : ""}
            </p>
            {profile.bio && <p className="mt-1 text-sm">{profile.bio}</p>}
            <dl className="mt-2 flex gap-6 text-sm">
              <Stat value={profile.trip_count} label="Trips" />
              <Stat value={profile.bookmark_count} label="Places" />
              <Stat value={profile.review_count} label="Reviews" />
            </dl>
          </div>
          <Button variant="outline" onClick={() => setEditing(true)} className="border-brand/50 text-brand sm:self-center">
            <Pencil aria-hidden="true" />
            Edit Profile
          </Button>
        </div>

        <PreviewSection title="Your saved trips" link={trips.length > 2 ? { href: "/trips", label: "View all" } : null}>
          {trips.length === 0 ? (
            <Empty>
              No trips yet. <Link href="/discover" className="font-medium text-brand">Start planning</Link>.
            </Empty>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {trips.slice(0, 2).map((trip) => (
                <TripCard key={trip.id} trip={trip} compact />
              ))}
            </div>
          )}
        </PreviewSection>
      </section>

      {/* --- Saved Trips & Places (tabs) --- */}
      <section className="bg-brand-soft/60 py-10 md:py-14 dark:bg-brand-soft/20">
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 sm:px-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Saved Trips &amp; Places</h2>
            <p className="mt-2 text-muted-foreground">Everything you want to explore, all in one place.</p>
          </div>
          <Tabs defaultValue={initialTab}>
            <TabsList>
              <TabsTrigger value="trips">Trips ({trips.length})</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks ({bookmarks.length})</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="trips">
              {trips.length === 0 ? (
                <Empty>Your trips will show up here.</Empty>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {trips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} compact />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="bookmarks">
              {bookmarks.length === 0 ? (
                <Empty>
                  Tap the bookmark icon on <Link href="/discover" className="font-medium text-brand">Discover</Link> to save places.
                </Empty>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {bookmarks.map((b) => (
                    <BookmarkCard
                      key={b.id}
                      bookmark={b}
                      onAddToTrip={addToTrip}
                      onRemove={removeBookmark}
                      busy={busyId === b.place.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="reviews">
              {reviews.length === 0 ? (
                <Empty>Complete a trip, then review the places you visited.</Empty>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {reviews.map((r) => (
                    <li key={r.id} className="space-y-2 rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-medium">{r.place.name}</h3>
                          <p className="text-xs text-muted-foreground">{placeSubtitle(r.place)}</p>
                        </div>
                        <StarRating value={r.rating} readOnly size="sm" />
                      </div>
                      {r.comment && <p className="text-sm">{r.comment}</p>}
                      <p className="text-xs text-muted-foreground">
                        {formatTripDate(r.created_at.slice(0, 10), "short")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* --- Review Your Visit --- */}
      <section aria-labelledby="review-title" className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6 md:py-14">
        <div>
          <h2 id="review-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Review Your Visit
          </h2>
          <p className="mt-2 text-muted-foreground">Share your experience after completing your adventure.</p>
        </div>
        {current ? (
          <>
            <ReviewForm
              key={current.place.id}
              place={current.place}
              onSubmit={(values) => submitReview(current, values)}
              onSkip={() => setSkipped((s) => [...s, current.place.id])}
            />
            {toReview.length > 1 && (
              <p className="text-center text-sm text-muted-foreground">{toReview.length - 1} more to review after this one.</p>
            )}
          </>
        ) : (
          <Empty>
            {visited.length
              ? "You're all caught up. Thanks for reviewing!"
              : "When you mark a trip as completed on My Trips, you can review its places here."}
          </Empty>
        )}
      </section>

      <EditProfileDialog open={editing} onOpenChange={setEditing} profile={profile} onSave={saveProfile} />
    </main>
  );
}

function Stat({ value, label }) {
  return (
    <div className="flex items-baseline gap-1">
      <dd className="font-semibold">{value}</dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}

function PreviewSection({ title, link, children }) {
  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{title}</h2>
        {link && (
          <Link href={link.href} className="text-sm font-medium text-brand">
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <p className="rounded-xl border border-dashed border-border bg-background/60 p-6 text-center text-sm text-muted-foreground">{children}</p>;
}
