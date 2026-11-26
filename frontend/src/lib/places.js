/**
 * Small helpers for showing places: labels, prices, photos and filter chips.
 */

export const CATEGORY_LABELS = {
  food: "Food",
  cafe: "Cafe",
  park: "Park",
  shop: "Shop",
  activity: "Activity",
  museum: "Museum",
  viewpoint: "Viewpoint",
  beach: "Beach",
  nightlife: "Nightlife",
  other: "Other",
};

/**
 * Filter chips on the Discover page (from the Figma design).
 * Each chip turns into query params for GET /places.
 */
export const FILTER_CHIPS = [
  { id: "food", label: "Food", params: { category: "food" } },
  { id: "cafe", label: "Coffee", params: { category: "cafe" } },
  { id: "park", label: "Parks", params: { category: "park" } },
  { id: "activity", label: "Activities", params: { category: "activity" } },
  { id: "beach", label: "Beaches", params: { category: "beach" } },
  { id: "under25", label: "Under $25", params: { max_cost: 25 }, variant: "price" },
  { id: "free", label: "Free", params: { max_cost: 0 }, variant: "price" },
];

/**
 * Click a chip on/off. The API filters by one category at a time, so picking
 * a category chip turns off the other category chips. Price chips work the same way.
 */
export function toggleChip(activeIds, id) {
  if (activeIds.includes(id)) return activeIds.filter((x) => x !== id);
  const chip = FILTER_CHIPS.find((c) => c.id === id);
  if (!chip) return activeIds;
  const sameKind = FILTER_CHIPS.filter((c) => (c.variant ?? "category") === (chip.variant ?? "category")).map(
    (c) => c.id
  );
  return [...activeIds.filter((x) => !sameKind.includes(x)), id];
}

/** Combine the active chips into one params object for the API. */
export function chipsToParams(activeIds) {
  const params = {};
  for (const chip of FILTER_CHIPS) {
    if (!activeIds.includes(chip.id)) continue;
    for (const [key, value] of Object.entries(chip.params)) {
      // Two price chips: keep the stricter (lower) limit.
      if (key === "max_cost" && params.max_cost != null) {
        params.max_cost = Math.min(params.max_cost, value);
      } else {
        params[key] = value;
      }
    }
  }
  return params;
}

/** 0 -> "Free", 12 -> "$12", 12.5 -> "$12.50". */
export function formatCost(value) {
  const n = Number(value ?? 0);
  if (!n) return "Free";
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/** "Park · Gardens" */
export function placeSubtitle(place) {
  const category = CATEGORY_LABELS[place?.category] ?? "Place";
  const sub = place?.subcategory;
  // Skip "Beach · Beach" when the subcategory just repeats the category.
  return sub && sub.toLowerCase() !== category.toLowerCase() ? `${category} · ${sub}` : category;
}

// Photos from our Figma designs, keyed by place name.
const LOCAL_PHOTOS = {
  "balboa park": "/images/places/balboa-park.jpg",
  "better buzz coffee": "/images/places/better-buzz-coffee.jpg",
  "sunset cliffs": "/images/places/sunset-cliffs.jpg",
  "the prado": "/images/places/the-prado.jpg",
  "japanese friendship garden": "/images/places/japanese-friendship-garden.jpg",
};

/**
 * Photo URL for a place, or null (then the UI shows a colored tile).
 * Only http(s) and local paths are allowed, so a bad image_url in the
 * database can't inject a "javascript:" URL.
 */
export function placeImage(place) {
  const url = place?.image_url;
  if (url && /^(https?:\/\/|\/)/i.test(url)) return url;
  return LOCAL_PHOTOS[place?.name?.trim().toLowerCase()] ?? null;
}

// Fallback tile colors per category (Tailwind classes).
export const CATEGORY_TILE = {
  food: "bg-orange-100 text-orange-700",
  cafe: "bg-amber-100 text-amber-800",
  park: "bg-emerald-100 text-emerald-700",
  shop: "bg-pink-100 text-pink-700",
  activity: "bg-sky-100 text-sky-700",
  museum: "bg-indigo-100 text-indigo-700",
  viewpoint: "bg-violet-100 text-violet-700",
  beach: "bg-cyan-100 text-cyan-700",
  nightlife: "bg-fuchsia-100 text-fuchsia-700",
  other: "bg-muted text-muted-foreground",
};

/**
 * Turn the homepage text box ("A relaxed Saturday in San Diego under $80,
 * parks and lunch") into Discover filters + a budget.
 */
export function parsePlanPrompt(text = "") {
  const lower = text.toLowerCase();
  let chips = [];
  // First match wins for the category (the API filters one category at a time).
  if (/\b(park|parks|garden|hike|outdoor)/.test(lower)) chips = toggleChip(chips, "park");
  else if (/\b(lunch|dinner|food|eat|brunch|restaurant)/.test(lower)) chips = toggleChip(chips, "food");
  else if (/\b(coffee|cafe|café)/.test(lower)) chips = toggleChip(chips, "cafe");
  else if (/\b(beach|ocean|sunset)/.test(lower)) chips = toggleChip(chips, "beach");
  else if (/\b(zoo|museum|activity|activities|fun)/.test(lower)) chips = toggleChip(chips, "activity");
  if (/\bfree\b/.test(lower)) chips = toggleChip(chips, "free");

  const money = /\$\s?(\d{1,5})/.exec(text) || /(\d{1,5})\s?(?:dollars|usd)/i.exec(text);
  const budget = money ? Number(money[1]) : null;
  return { chips, budget };
}

/**
 * Trip stops only include a short version of each place (no coordinates or
 * typical visit length). Fill those in from the full places list so the map
 * and route math work. `allPlaces` is the response of GET /places.
 */
export function withPlaceDetails(stops, allPlaces) {
  const byId = new Map(allPlaces.map((p) => [p.id, p]));
  return stops.map((stop) => {
    const full = byId.get(stop.place.id);
    if (!full) return stop;
    return {
      ...stop,
      duration_minutes: stop.duration_minutes ?? full.typical_duration_minutes ?? null,
      place: { ...full, ...stop.place, latitude: full.latitude, longitude: full.longitude },
    };
  });
}
