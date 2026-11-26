import { ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCost } from "@/lib/places";
import { formatClock, formatDuration } from "@/lib/route";
import TravelModeTabs from "./TravelModeTabs";

/** "Travel Details" + "Route Details": each leg between stops for the chosen mode. */
export default function TravelDetails({ stops, schedule, mode, modeLabel, onModeChange, disabled }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Travel details</CardTitle>
        <CardDescription>
          Choose how you want to travel between stops. Times and costs update with your choice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <TravelModeTabs value={mode} onChange={onModeChange} disabled={disabled} size="lg" />
        {stops.length < 2 ? (
          <p className="text-sm text-muted-foreground">Add at least two stops to see the route between them.</p>
        ) : (
          <ol className="space-y-3">
            {stops.slice(1).map((stop, i) => {
              const from = stops[i];
              const leg = schedule[i + 1].legBefore;
              const leave = schedule[i].depart;
              return (
                <li
                  key={stop.id}
                  className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div className="min-w-0 space-y-2">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      <Num n={i + 1} /> {from.place.name}
                      <ArrowRight aria-label="to" className="size-4 text-muted-foreground" />
                      <Num n={i + 2} /> {stop.place.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {modeLabel} {formatDuration(leg.minutes)} · {leg.miles} mi
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm md:justify-end">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock aria-hidden="true" className="size-4" />
                      {formatClock(leave)} - {formatClock(leave + leg.minutes)}
                    </span>
                    <span className={leg.cost ? "font-semibold text-destructive" : "font-semibold text-success"}>
                      {formatCost(leg.cost)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function Num({ n }) {
  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
      {n}
    </span>
  );
}
