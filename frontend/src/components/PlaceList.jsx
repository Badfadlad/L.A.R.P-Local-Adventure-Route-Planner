"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage, placesApi } from "@/api/api";

export default function PlaceList() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      try {
        const response = await placesApi.list({ limit: 6 });
        if (!cancelled) setPlaces(response.data);
      } catch (requestError) {
        if (!cancelled) setError(getErrorMessage(requestError, "Unable to load places."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlaces();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="w-full max-w-4xl">
      <h2 className="mb-3 text-xl font-semibold">Discover places</h2>
      {loading && <p className="text-sm text-muted-foreground">Loading places...</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!loading && !error && places.length === 0 && (
        <p className="text-sm text-muted-foreground">No places have been added yet.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => (
          <Card key={place.id}>
            <CardHeader>
              <CardTitle className="text-base">{place.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {place.category} · {place.city}
              </p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{place.description || "A local adventure waiting to be explored."}</p>
              <p className="font-medium">
                {place.estimated_cost === 0 ? "Free" : `$${place.estimated_cost.toFixed(2)} estimated`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
