/** "2026-10-17" -> "Saturday, October 17" (or "Sat, Oct 17" with style "short").
 *  Parsed as a local date, so it doesn't shift a day because of time zones. */
export function formatTripDate(value, style = "long") {
  if (!value) return "";
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  return style === "short"
    ? date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
