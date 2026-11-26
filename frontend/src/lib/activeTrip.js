/**
 * The "trip you're currently building".
 *
 * Discover's "Add Stop" adds to this trip, and Plan a Trip opens it. We keep
 * only its id in localStorage; the trip itself lives in the backend.
 */

import { tripsApi } from "@/api/api";
import { toApiTime } from "@/lib/route";

const KEY = "activeTripId";
const PENDING_BUDGET_KEY = "pendingBudget";

export function getActiveTripId() {
  if (typeof window === "undefined") return null;
  const id = Number(localStorage.getItem(KEY));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function setActiveTripId(id) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(KEY, String(id));
  else localStorage.removeItem(KEY);
}

/** Budget typed on the homepage, used when the next trip is created. */
export function setPendingBudget(budget) {
  if (typeof window === "undefined") return;
  if (budget) localStorage.setItem(PENDING_BUDGET_KEY, String(budget));
  else localStorage.removeItem(PENDING_BUDGET_KEY);
}

function takePendingBudget() {
  if (typeof window === "undefined") return null;
  const value = Number(localStorage.getItem(PENDING_BUDGET_KEY));
  localStorage.removeItem(PENDING_BUDGET_KEY);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Next Saturday as "YYYY-MM-DD" (the designs plan "a Saturday in San Diego"). */
export function nextSaturday(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Return the active trip (loading it from the API), or create a new one if
 * there isn't one yet or it was completed/deleted.
 */
export async function ensureActiveTrip() {
  const id = getActiveTripId();
  if (id) {
    try {
      const { data } = await tripsApi.get(id);
      if (data.status === "planned") return data;
    } catch {
      // deleted or belongs to someone else: fall through and make a new one
    }
  }
  const { data } = await tripsApi.create({
    name: "My San Diego Day",
    destination: "San Diego, CA",
    trip_date: nextSaturday(),
    start_time: toApiTime(9 * 60),
    transport_mode: "walking",
    budget: takePendingBudget() ?? 100,
  });
  setActiveTripId(data.id);
  return data;
}

/** Add a place to the active trip. Returns the updated trip id. */
export async function addPlaceToActiveTrip(place) {
  const trip = await ensureActiveTrip();
  await tripsApi.addStop(trip.id, { place_id: place.id });
  return trip.id;
}
