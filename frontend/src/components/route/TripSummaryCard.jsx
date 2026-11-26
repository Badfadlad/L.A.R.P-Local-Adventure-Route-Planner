import { Clock, Flag, MapPin, Route } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatClock, formatDuration } from "@/lib/route";

/** "Trip summary": stops, travel time, distance and finish time. */
export default function TripSummaryCard({ dateLabel, stopCount, minutes, miles, finish }) {
  const tiles = [
    { icon: MapPin, value: stopCount, label: stopCount === 1 ? "stop" : "stops" },
    { icon: Clock, value: formatDuration(minutes), label: "travel time" },
    { icon: Route, value: `${miles} mi`, label: "distance" },
    { icon: Flag, value: finish != null ? formatClock(finish) : "-", label: "finish around" },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Trip summary</CardTitle>
        {dateLabel && <CardDescription>{dateLabel}</CardDescription>}
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3">
          {tiles.map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-xl border border-border p-3">
              <Icon aria-hidden="true" className="mb-2 size-5 rounded-md bg-brand-soft p-0.5 text-brand" />
              <dd className="text-lg font-semibold">{value}</dd>
              <dt className="text-xs text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
