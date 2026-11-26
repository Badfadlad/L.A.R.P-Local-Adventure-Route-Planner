import {
  buildBudget,
  buildSchedule,
  formatClock,
  formatDuration,
  haversineMiles,
  legBetween,
  moveItem,
  optimizeOrder,
  parseTime,
  routeTotals,
  toApiTime,
  TRANSIT_DAY_PASS,
} from "@/lib/route";

const balboa = { id: 1, name: "Balboa Park", latitude: 32.7341, longitude: -117.1446, estimated_cost: 0 };
const prado = { id: 2, name: "The Prado", latitude: 32.7314, longitude: -117.1505, estimated_cost: 32 };
const coffee = { id: 3, name: "Better Buzz Coffee", latitude: 32.748, longitude: -117.2181, estimated_cost: 12 };
const garden = { id: 4, name: "Japanese Friendship Garden", latitude: 32.7301, longitude: -117.149, estimated_cost: 16 };

const stop = (id, place, extra = {}) => ({ id, place, cost: place.estimated_cost, ...extra });

describe("distance", () => {
  test("same point is 0 miles", () => {
    expect(haversineMiles(balboa, balboa)).toBe(0);
  });

  test("Balboa Park to The Prado is a short walk (~0.4 mi)", () => {
    expect(haversineMiles(balboa, prado)).toBeGreaterThan(0.3);
    expect(haversineMiles(balboa, prado)).toBeLessThan(0.5);
  });

  test("missing coordinates count as 0 instead of crashing", () => {
    expect(haversineMiles(balboa, { name: "Nowhere" })).toBe(0);
  });
});

describe("legBetween", () => {
  test("walking is free and slower than driving", () => {
    const walk = legBetween(coffee, balboa, "walking");
    const drive = legBetween(coffee, balboa, "driving");
    expect(walk.cost).toBe(0);
    expect(walk.minutes).toBeGreaterThan(drive.minutes);
    expect(drive.cost).toBeGreaterThan(0); // fuel + parking
  });

  test("transit costs one fare", () => {
    expect(legBetween(coffee, balboa, "transit").cost).toBe(2.5);
  });
});

describe("routeTotals", () => {
  test("adds up every leg", () => {
    const totals = routeTotals([coffee, balboa, prado], "walking");
    expect(totals.legs).toHaveLength(2);
    expect(totals.miles).toBeCloseTo(totals.legs[0].miles + totals.legs[1].miles, 1);
  });

  test("transit never costs more than a day pass", () => {
    const many = [coffee, balboa, coffee, balboa, coffee, balboa];
    expect(routeTotals(many, "transit").transportCost).toBe(TRANSIT_DAY_PASS);
  });

  test("one stop has no travel", () => {
    expect(routeTotals([balboa], "driving")).toMatchObject({ miles: 0, minutes: 0, transportCost: 0 });
  });
});

describe("time helpers", () => {
  test.each([
    ["09:00:00", 540],
    ["13:05", 785],
    ["", null],
    ["nope", null],
  ])("parseTime(%p) -> %p", (input, expected) => {
    expect(parseTime(input)).toBe(expected);
  });

  test.each([
    [0, "12:00 AM"],
    [540, "9:00 AM"],
    [720, "12:00 PM"],
    [810, "1:30 PM"],
  ])("formatClock(%p) -> %p", (minutes, expected) => {
    expect(formatClock(minutes)).toBe(expected);
  });

  test("toApiTime pads hours and minutes", () => {
    expect(toApiTime(9 * 60 + 5)).toBe("09:05");
  });

  test.each([
    [45, "45 min"],
    [60, "1 hr"],
    [75, "1 hr 15 min"],
    [0, "0 min"],
  ])("formatDuration(%p) -> %p", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe("buildSchedule", () => {
  test("each stop starts after the last one ends plus travel time", () => {
    const stops = [stop(10, balboa, { duration_minutes: 60 }), stop(11, prado, { duration_minutes: 30 })];
    const [first, second] = buildSchedule(stops, { startTime: "09:00", mode: "walking" });
    expect(first.arrive).toBe(540);
    expect(first.depart).toBe(600);
    expect(second.arrive).toBe(600 + second.legBefore.minutes);
    expect(second.depart).toBe(second.arrive + 30);
  });

  test("a later planned arrival time is respected", () => {
    const stops = [stop(10, balboa, { duration_minutes: 30 }), stop(11, prado, { arrival_time: "12:30:00" })];
    expect(buildSchedule(stops, { startTime: "09:00" })[1].arrive).toBe(750);
  });
});

describe("buildBudget", () => {
  test("totals stop costs plus transport and shows what's left", () => {
    const stops = [stop(1, coffee), stop(2, balboa), stop(3, prado), stop(4, garden)];
    const budget = buildBudget(stops, { budget: 100, mode: "walking" });
    expect(budget.stopsTotal).toBe(60);
    expect(budget.transportCost).toBe(0);
    expect(budget.remaining).toBe(40);
  });

  test("going over budget gives a negative remaining", () => {
    const budget = buildBudget([stop(1, prado)], { budget: 20 });
    expect(budget.remaining).toBe(-12);
  });

  test("no budget set -> remaining is null", () => {
    expect(buildBudget([stop(1, prado)]).remaining).toBeNull();
  });
});

describe("reordering", () => {
  test("moveItem moves without changing the original", () => {
    const list = ["a", "b", "c"];
    expect(moveItem(list, 0, 2)).toEqual(["b", "c", "a"]);
    expect(list).toEqual(["a", "b", "c"]);
    expect(moveItem(list, 0, 5)).toBe(list);
  });

  test("optimizeOrder keeps the first stop and visits the closest next", () => {
    // coffee -> garden -> balboa -> prado zig-zags; optimized should group the Balboa Park stops.
    const stops = [stop(1, coffee), stop(2, balboa), stop(3, garden), stop(4, prado)];
    const ordered = optimizeOrder(stops);
    expect(ordered[0].id).toBe(1);
    expect(ordered).toHaveLength(4);
    const total = (list) => routeTotals(list.map((s) => s.place)).miles;
    expect(total(ordered)).toBeLessThanOrEqual(total(stops));
  });
});
