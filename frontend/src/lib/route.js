/**
 * Route math for the Route Builder (distance, travel time, schedule, budget).
 *
 * The backend stores places with latitude/longitude but has no maps API, so
 * we estimate everything here from straight-line distance. All functions are
 * pure (no React, no network), which makes them easy to unit test.
 */

export const TRAVEL_MODES = [
  { id: "walking", label: "Walking" },
  { id: "driving", label: "Driving" },
  { id: "biking", label: "Biking" },
  { id: "transit", label: "Transit" },
];

// Average city speeds in miles per hour, plus a fixed wait for transit.
const MODE_SPEED_MPH = { walking: 3, biking: 10, driving: 22, transit: 12 };
const TRANSIT_WAIT_MIN = 6;
// Streets aren't straight lines: real routes are ~30% longer.
const ROAD_FACTOR = 1.3;

export const TRANSIT_FARE = 2.5; // San Diego MTS single ride
export const TRANSIT_DAY_PASS = 6;
export const FUEL_PER_MILE = 0.2;
export const PARKING_PER_STOP = 2.5;
export const DEFAULT_STOP_MINUTES = 60;

/** Straight-line distance between two {latitude, longitude} points, in miles. */
export function haversineMiles(a, b) {
  if (a?.latitude == null || a?.longitude == null || b?.latitude == null || b?.longitude == null) {
    return 0;
  }
  const R = 3958.8; // Earth radius in miles
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** One leg between two places: { miles, minutes, cost } for a travel mode. */
export function legBetween(from, to, mode = "walking") {
  const miles = round1(haversineMiles(from, to) * ROAD_FACTOR);
  const speed = MODE_SPEED_MPH[mode] ?? MODE_SPEED_MPH.walking;
  let minutes = Math.max(1, Math.round((miles / speed) * 60));
  if (mode === "transit") minutes += TRANSIT_WAIT_MIN;
  if (miles === 0) minutes = 0;

  let cost = 0;
  if (mode === "transit" && miles > 0) cost = TRANSIT_FARE;
  if (mode === "driving") cost = round2(miles * FUEL_PER_MILE + PARKING_PER_STOP);
  return { miles, minutes, cost };
}

/**
 * Totals for a whole route.
 * `places` is the stops' places in order. Returns
 * { legs, miles, minutes, transportCost }.
 */
export function routeTotals(places, mode = "walking") {
  const legs = [];
  for (let i = 1; i < places.length; i++) {
    legs.push(legBetween(places[i - 1], places[i], mode));
  }
  const miles = round1(legs.reduce((sum, l) => sum + l.miles, 0));
  const minutes = legs.reduce((sum, l) => sum + l.minutes, 0);
  let transportCost = round2(legs.reduce((sum, l) => sum + l.cost, 0));
  // Transit: never pay more than a day pass.
  if (mode === "transit") transportCost = Math.min(transportCost, TRANSIT_DAY_PASS);
  return { legs, miles, minutes, transportCost };
}

/** "09:30:00" or "09:30" -> minutes after midnight. Returns null if empty/invalid. */
export function parseTime(value) {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minutes after midnight -> "9:30 AM". */
export function formatClock(totalMinutes) {
  if (totalMinutes == null) return "";
  const m = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${suffix}`;
}

/** Minutes after midnight -> "13:05" (the format the backend expects). */
export function toApiTime(totalMinutes) {
  const m = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** 75 -> "1 hr 15 min", 45 -> "45 min", 120 -> "2 hr". */
export function formatDuration(minutes) {
  if (!minutes || minutes < 1) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
}

/**
 * Day schedule: when you arrive at and leave each stop.
 * A stop's own arrival_time wins if it's later than when you could get there.
 */
export function buildSchedule(stops, { startTime = "09:00", mode = "walking" } = {}) {
  let clock = parseTime(startTime) ?? 9 * 60;
  const { legs } = routeTotals(stops.map((s) => s.place), mode);

  return stops.map((stop, i) => {
    if (i > 0) clock += legs[i - 1].minutes;
    const planned = parseTime(stop.arrival_time);
    const arrive = planned != null && planned > clock ? planned : clock;
    const duration = stop.duration_minutes || DEFAULT_STOP_MINUTES;
    const depart = arrive + duration;
    clock = depart;
    return { stopId: stop.id, arrive, depart, duration, legBefore: i > 0 ? legs[i - 1] : null };
  });
}

/**
 * Budget card numbers.
 * Returns { items, stopsTotal, transportCost, total, budget, remaining }.
 */
export function buildBudget(stops, { budget = null, mode = "walking" } = {}) {
  const items = stops.map((s) => ({
    id: s.id,
    name: s.place?.name ?? "Stop",
    cost: Number(s.cost ?? s.estimated_cost ?? s.place?.estimated_cost ?? 0),
  }));
  const stopsTotal = round2(items.reduce((sum, it) => sum + it.cost, 0));
  const { transportCost } = routeTotals(stops.map((s) => s.place), mode);
  const total = round2(stopsTotal + transportCost);
  const remaining = budget == null ? null : round2(Number(budget) - total);
  return { items, stopsTotal, transportCost, total, budget: budget == null ? null : Number(budget), remaining };
}

/** Move one item in an array from index `from` to index `to` (returns a new array). */
export function moveItem(list, from, to) {
  if (to < 0 || to >= list.length || from === to) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/**
 * "Optimize my route": keep the first stop, then always go to the closest
 * stop you haven't visited yet (nearest-neighbour). Returns stops in the new order.
 */
export function optimizeOrder(stops) {
  if (stops.length < 3) return stops;
  const remaining = stops.slice(1);
  const ordered = [stops[0]];
  while (remaining.length) {
    const last = ordered[ordered.length - 1].place;
    let best = 0;
    for (let i = 1; i < remaining.length; i++) {
      if (haversineMiles(last, remaining[i].place) < haversineMiles(last, remaining[best].place)) best = i;
    }
    ordered.push(remaining.splice(best, 1)[0]);
  }
  return ordered;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
