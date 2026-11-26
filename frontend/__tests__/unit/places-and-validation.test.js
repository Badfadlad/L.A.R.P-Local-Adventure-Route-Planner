import {
  chipsToParams,
  formatCost,
  parsePlanPrompt,
  placeImage,
  placeSubtitle,
  toggleChip,
  withPlaceDetails,
} from "@/lib/places";
import { sanitizeSearch, sanitizeText, validateProfile, validateReview, validateTrip } from "@/lib/validation";
import { formatTripDate } from "@/lib/dates";
import { nextSaturday } from "@/lib/activeTrip";
import { isTokenExpired } from "@/context/AuthContext";

describe("places helpers", () => {
  test.each([
    [0, "Free"],
    [null, "Free"],
    [12, "$12"],
    [12.5, "$12.50"],
  ])("formatCost(%p) -> %p", (value, expected) => {
    expect(formatCost(value)).toBe(expected);
  });

  test("placeSubtitle skips a repeated subcategory", () => {
    expect(placeSubtitle({ category: "park", subcategory: "Gardens" })).toBe("Park · Gardens");
    expect(placeSubtitle({ category: "beach", subcategory: "Beach" })).toBe("Beach");
  });

  test("category chips replace each other, price chips stack with them", () => {
    let chips = toggleChip([], "food");
    chips = toggleChip(chips, "park");
    chips = toggleChip(chips, "under25");
    expect(chips).toEqual(["park", "under25"]);
    expect(chipsToParams(chips)).toEqual({ category: "park", max_cost: 25 });
    expect(toggleChip(chips, "park")).toEqual(["under25"]);
  });

  test("homepage prompt becomes filters and a budget", () => {
    expect(parsePlanPrompt("A relaxed Saturday under $80 with parks and lunch")).toEqual({
      chips: ["park"],
      budget: 80,
    });
    expect(parsePlanPrompt("free beach day")).toEqual({ chips: ["beach", "free"], budget: null });
  });

  test("placeImage only allows safe URLs", () => {
    expect(placeImage({ name: "X", image_url: "https://example.com/a.jpg" })).toBe("https://example.com/a.jpg");
    expect(placeImage({ name: "X", image_url: "javascript:alert(1)" })).toBeNull();
    expect(placeImage({ name: "Balboa Park" })).toBe("/images/places/balboa-park.jpg");
  });

  test("withPlaceDetails adds coordinates to trip stops", () => {
    const stops = [{ id: 1, place: { id: 7, name: "Balboa Park" } }];
    const all = [{ id: 7, name: "Balboa Park", latitude: 32.7, longitude: -117.1, typical_duration_minutes: 120 }];
    const [filled] = withPlaceDetails(stops, all);
    expect(filled.place.latitude).toBe(32.7);
    expect(filled.duration_minutes).toBe(120);
  });
});

describe("validation (security extra credit)", () => {
  test("sanitizeText trims, strips control characters and caps length", () => {
    expect(sanitizeText("  hi\u0000there  ")).toBe("hithere");
    expect(sanitizeText("a".repeat(600), 500)).toHaveLength(500);
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeSearch("x".repeat(200))).toHaveLength(100);
  });

  test("review needs 1-5 stars", () => {
    expect(validateReview({ rating: 0 })).toMatch(/rating/);
    expect(validateReview({ rating: 6 })).toMatch(/rating/);
    expect(validateReview({ rating: 4, comment: "Great" })).toBe("");
    expect(validateReview({ rating: 4, comment: "x".repeat(2001) })).toMatch(/2000/);
  });

  test("trip and profile limits match the backend", () => {
    expect(validateTrip({ name: "  " })).toMatch(/name/);
    expect(validateTrip({ name: "Trip", budget: "-5" })).toMatch(/positive/);
    expect(validateTrip({ name: "Trip", budget: "" })).toBe("");
    expect(validateProfile({ bio: "x".repeat(501) })).toMatch(/500/);
  });

  test("expired JWTs are detected", () => {
    const make = (exp) => `x.${btoa(JSON.stringify({ exp }))}.y`;
    const now = Date.now();
    expect(isTokenExpired(make(now / 1000 - 60), now)).toBe(true);
    expect(isTokenExpired(make(now / 1000 + 600), now)).toBe(false);
    expect(isTokenExpired("garbage")).toBe(true);
  });
});

describe("dates", () => {
  test("formatTripDate doesn't shift a day because of time zones", () => {
    expect(formatTripDate("2026-10-17")).toBe("Saturday, October 17");
    expect(formatTripDate("2026-10-17", "short")).toBe("Sat, Oct 17");
    expect(formatTripDate(null)).toBe("");
  });

  test("nextSaturday is always a future Saturday", () => {
    expect(nextSaturday(new Date(2026, 10, 25))).toBe("2026-11-28"); // Wed -> Sat
    expect(nextSaturday(new Date(2026, 10, 28))).toBe("2026-12-05"); // Sat -> next Sat
  });
});
