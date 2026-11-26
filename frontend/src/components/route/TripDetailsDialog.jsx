"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeText, validateTrip } from "@/lib/validation";

/**
 * Edit a trip's name, destination, date, start time and budget.
 * `onSave(changes)` should PATCH the trip and may throw (we show the error).
 */
export default function TripDetailsDialog({ open, onOpenChange, trip, onSave, title = "Trip details", submitLabel = "Save" }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Change where, when and how much you want to spend.</DialogDescription>
        {/* key: reset the form each time it opens */}
        {open && trip && <TripForm key={trip.id} trip={trip} onSave={onSave} submitLabel={submitLabel} />}
      </DialogContent>
    </Dialog>
  );
}

function TripForm({ trip, onSave, submitLabel }) {
  const [form, setForm] = useState({
    name: trip.name ?? "",
    destination: trip.destination ?? "",
    trip_date: trip.trip_date ?? "",
    start_time: (trip.start_time ?? "").slice(0, 5),
    budget: trip.budget ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const clean = {
      name: sanitizeText(form.name, 150),
      destination: sanitizeText(form.destination, 150) || null,
      trip_date: form.trip_date || null,
      start_time: form.start_time || null,
      budget: form.budget === "" ? null : Number(form.budget),
    };
    const problem = validateTrip({ name: clean.name, budget: form.budget });
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(clean);
    } catch (err) {
      setError(err?.message || "Could not save the trip.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-name">Trip name</Label>
        <Input id="trip-name" value={form.name} onChange={set("name")} maxLength={150} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-destination">Destination</Label>
        <Input id="trip-destination" value={form.destination} onChange={set("destination")} maxLength={150} placeholder="San Diego, CA" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="trip-date">Date</Label>
          <Input id="trip-date" type="date" value={form.trip_date} onChange={set("trip_date")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="trip-start">Start time</Label>
          <Input id="trip-start" type="time" value={form.start_time} onChange={set("start_time")} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="trip-budget">Budget per person ($)</Label>
        <Input id="trip-budget" type="number" inputMode="decimal" min="0" step="1" value={form.budget} onChange={set("budget")} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
