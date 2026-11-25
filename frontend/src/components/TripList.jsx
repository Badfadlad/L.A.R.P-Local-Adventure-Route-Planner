"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage, tripsApi } from "@/api/api";
import { useAuth } from "@/context/AuthContext";

export default function TripList() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;

    async function loadTrips() {
      setLoading(true);
      try {
        const response = await tripsApi.list();
        if (!cancelled) setTrips(response.data);
      } catch (requestError) {
        if (!cancelled) setError(getErrorMessage(requestError, "Unable to load your trips."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTrips();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  if (authLoading || !isAuthenticated) return null;

  return (
    <section className="w-full max-w-4xl">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Your trips</h2>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading trips...</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!loading && !error && trips.length === 0 && (
        <p className="text-sm text-muted-foreground">You have not created a trip yet.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {trips.map((trip) => (
          <Card key={trip.id}>
            <CardHeader>
              <CardTitle className="text-base">{trip.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {trip.destination || "No destination"} · {trip.status}
              </p>
            </CardHeader>
            <CardContent className="text-sm">
              <p>{trip.stop_count} stop{trip.stop_count === 1 ? "" : "s"}</p>
              <p>${trip.estimated_total.toFixed(2)} estimated</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
